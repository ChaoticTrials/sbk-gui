use std::sync::atomic::Ordering;
use tauri::{AppHandle, Emitter, State};

use crate::commands::cancel::CancellationState;
use crate::{
    archive_state::SharedArchiveState, commands::walk_and_prettify, types::ExtractionProgress,
};

fn resolve_threads(threads: usize) -> usize {
    if threads == 0 {
        (num_cpus::get() / 2).max(1)
    } else {
        threads.min(num_cpus::get()).max(1)
    }
}

pub fn move_dir_contents(src: &std::path::Path, dest: &std::path::Path) -> std::io::Result<()> {
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let target = dest.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            std::fs::create_dir_all(&target)?;
            move_dir_contents(&entry.path(), &target)?;
            let _ = std::fs::remove_dir(&entry.path());
        } else {
            std::fs::rename(&entry.path(), &target)?;
        }
    }
    Ok(())
}

/// Extract files matching `patterns` from the open archive into `output_dir`.
/// Emits "extraction-progress" events after each file is written.
/// Supports cancellation via `CancellationState`; if cancelled returns Err("Extraction cancelled").
#[tauri::command]
pub async fn extract_files(
    app: AppHandle,
    state: State<'_, SharedArchiveState>,
    cancel: State<'_, CancellationState>,
    patterns: Vec<String>,
    output_dir: String,
    threads: usize,
    prettify_json: bool,
    strip_prefix: String,
) -> Result<u64, String> {
    let archive_path = {
        let guard = state.lock().unwrap();
        guard.path.clone().ok_or("No archive open")?
    };

    let resolved_threads = resolve_threads(threads);

    let cancel_flag = cancel.0.clone();
    let cancel_flag_cb = cancel_flag.clone();
    cancel_flag.store(false, Ordering::Relaxed);

    let app2 = app.clone();
    let out = output_dir.clone();

    tokio::task::spawn_blocking(move || {
        let out_path = std::path::Path::new(&out);

        let tmp = tempfile::Builder::new()
            .prefix(".sbk_tmp_")
            .tempdir_in(out_path)
            .map_err(|e| e.to_string())?;
        let extraction_dir = tmp.path().to_path_buf();

        let count = sbk::extract::extract_with_progress(
            std::path::Path::new(&archive_path),
            &patterns,
            &extraction_dir,
            resolved_threads,
            move |phase: &str, completed: usize, total: usize| -> bool {
                let _ = app2.emit(
                    "extraction-progress",
                    ExtractionProgress {
                        phase: phase.to_string(),
                        completed,
                        total,
                    },
                );
                !cancel_flag_cb.load(Ordering::Relaxed)
            },
        )
        .map_err(|e| e.to_string())?;

        if prettify_json {
            walk_and_prettify(&extraction_dir);
        }

        let src_dir = if strip_prefix.is_empty() {
            extraction_dir.clone()
        } else {
            extraction_dir.join(&strip_prefix)
        };
        if src_dir.exists() {
            move_dir_contents(&src_dir, out_path).map_err(|e| e.to_string())?;
        }

        Ok(count)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Extract files to a temporary directory and return the temp dir path.
/// Used before handing paths to OS APIs (open-in-app).
/// The TempDir is leaked so files persist during the session.
#[tauri::command]
pub async fn extract_to_temp(
    app: AppHandle,
    state: State<'_, SharedArchiveState>,
    patterns: Vec<String>,
    threads: usize,
    prettify_json: bool,
) -> Result<String, String> {
    let archive_path = {
        let guard = state.lock().unwrap();
        guard.path.clone().ok_or("No archive open")?
    };

    let resolved_threads = resolve_threads(threads);

    tokio::task::spawn_blocking(move || {
        drop(app);
        let tmp = tempfile::tempdir().map_err(|e| e.to_string())?;
        sbk::extract::extract_with_progress(
            std::path::Path::new(&archive_path),
            &patterns,
            tmp.path(),
            resolved_threads,
            |_, _, _| true,
        )
        .map_err(|e| e.to_string())?;

        if prettify_json {
            walk_and_prettify(tmp.path());
        }

        // Leak the TempDir so files survive while the open session is live.
        Ok(tmp.keep().to_string_lossy().into_owned())
    })
    .await
    .map_err(|e| e.to_string())?
}
