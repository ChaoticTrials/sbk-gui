use tauri::State;

use crate::archive_state::SharedArchiveState;

/// Verify all frame and index checksums of the open archive.
/// Returns `true` if everything passes, `false` if any checksum fails.
/// Runs in a blocking thread to avoid stalling the async runtime.
#[tauri::command]
pub async fn verify_archive(state: State<'_, SharedArchiveState>) -> Result<bool, String> {
    let archive_path = {
        let guard = state.lock().unwrap();
        guard.path.clone().ok_or("No archive open")?
    };

    tokio::task::spawn_blocking(move || {
        sbk::verify::verify(
            std::path::Path::new(&archive_path),
            (num_cpus::get() / 2).max(1),
        )
        .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
