use std::sync::atomic::Ordering;
use tauri::{AppHandle, Emitter, State};

use crate::commands::cancel::CancellationState;
use crate::types::ExtractionProgress;

pub struct ExtractHereMode(pub Option<String>);

#[tauri::command]
pub fn get_extract_here_path(state: State<'_, ExtractHereMode>) -> Option<String> {
    state.0.clone()
}

#[tauri::command]
pub async fn extract_here_with_progress(
    app: AppHandle,
    state: State<'_, ExtractHereMode>,
    cancel: State<'_, CancellationState>,
    threads: usize,
) -> Result<(u64, String), String> {
    let archive_path = state.0.clone().ok_or("not in extract-here mode")?;
    let archive = std::path::Path::new(&archive_path);
    let parent = archive.parent().ok_or("cannot determine parent directory")?;
    let stem = archive.file_stem().ok_or("cannot determine archive name")?;
    let output_dir = parent.join(stem);
    let newly_created = !output_dir.exists();
    std::fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    let resolved_threads = if threads == 0 {
        (num_cpus::get() / 2).max(1)
    } else {
        threads.min(num_cpus::get()).max(1)
    };

    let cancel_flag = cancel.0.clone();
    let cancel_flag_cb = cancel_flag.clone();
    cancel_flag.store(false, Ordering::Relaxed);

    let out = output_dir.clone();
    let arch = archive_path.clone();

    let inner: Result<u64, String> = tokio::task::spawn_blocking(move || {
        let tmp = tempfile::Builder::new()
            .prefix(".sbk_tmp_")
            .tempdir_in(&out)
            .map_err(|e| e.to_string())?;
        let extraction_dir = tmp.path().to_path_buf();

        let count = sbk::extract::extract_with_progress(
            std::path::Path::new(&arch),
            &["**".to_string()],
            &extraction_dir,
            resolved_threads,
            move |phase, completed, total| {
                let _ = app.emit(
                    "extraction-progress",
                    ExtractionProgress { phase: phase.to_string(), completed, total },
                );
                !cancel_flag_cb.load(Ordering::Relaxed)
            },
        )
        .map_err(|e| e.to_string())?;

        crate::commands::extract::move_dir_contents(&extraction_dir, &out)
            .map_err(|e| e.to_string())?;

        Ok(count)
    })
    .await
    .map_err(|e| e.to_string())?;

    match inner {
        Ok(count) => Ok((count, output_dir.to_string_lossy().into_owned())),
        Err(e) => {
            if e.contains("cancelled") && newly_created {
                let _ = std::fs::remove_dir(&output_dir);
            }
            Err(e)
        }
    }
}
