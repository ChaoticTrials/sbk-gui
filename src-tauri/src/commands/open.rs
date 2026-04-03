use std::sync::atomic::Ordering;
use tauri::State;

use crate::archive_state::SharedArchiveState;
use crate::commands::cancel::CancellationState;
use crate::commands::prettify_json_file;

/// Open a single archive entry with the default system application.
/// Extracts to a temp directory first, then opens with `open::that`.
/// Respects the shared `CancellationState` so a pending open can be
/// interrupted if the user closes the archive.
#[tauri::command]
pub async fn open_file_in_app(
    state: State<'_, SharedArchiveState>,
    cancel: State<'_, CancellationState>,
    entry_path: String,
    threads: usize,
    prettify_json: bool,
) -> Result<(), String> {
    let archive_path = {
        let guard = state.lock().unwrap();
        guard.path.clone().ok_or("No archive open")?
    };

    let resolved_threads = if threads == 0 {
        num_cpus::get()
    } else {
        threads
    };

    let cancel_flag = cancel.0.clone();
    let cancel_flag_cb = cancel_flag.clone();
    cancel_flag.store(false, Ordering::Relaxed);

    tokio::task::spawn_blocking(move || {
        let tmp = tempfile::tempdir().map_err(|e| e.to_string())?;
        sbk::extract::extract_with_progress(
            std::path::Path::new(&archive_path),
            &[entry_path.clone()],
            tmp.path(),
            resolved_threads,
            move |_, _, _| !cancel_flag_cb.load(Ordering::Relaxed),
        )
        .map_err(|e| e.to_string())?;

        let abs_path = tmp.path().join(&entry_path);

        if prettify_json
            && abs_path
                .extension()
                .map_or(false, |e| e.eq_ignore_ascii_case("json"))
        {
            prettify_json_file(&abs_path);
        }

        // Keep TempDir so the file survives while the external app is open.
        let _ = tmp.keep();
        open::that(abs_path).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
