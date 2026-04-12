mod archive_state;
mod commands;
mod types;

use archive_state::SharedArchiveState;
use commands::cancel::CancellationState;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(SharedArchiveState::default())
        .manage(CancellationState::default())
        .invoke_handler(tauri::generate_handler![
            commands::archive::open_archive,
            commands::archive::close_archive,
            commands::extract::extract_files,
            commands::extract::extract_to_temp,
            commands::open::open_file_in_app,
            commands::cancel::cancel_extraction,
            commands::system::get_cpu_count,
            commands::system::get_version_info,
            commands::system::get_cli_path,
            commands::verify::verify_archive,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
