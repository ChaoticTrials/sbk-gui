mod archive_state;
mod commands;
mod types;

use archive_state::SharedArchiveState;
use commands::cancel::CancellationState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(SharedArchiveState::default())
        .manage(CancellationState::default())
        .manage(commands::extract_here::ExtractHereMode(None))
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
            commands::extract_here::get_extract_here_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn run_extract_here(archive_path: &str) {
    let path = archive_path.to_string();
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(commands::extract_here::ExtractHereMode(Some(path)))
        .manage(CancellationState::default())
        .setup(|app| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: 520.0,
                    height: 340.0,
                }));
                let _ = win.set_resizable(false);
                let _ = win.center();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::extract_here::get_extract_here_path,
            commands::extract_here::extract_here_with_progress,
            commands::cancel::cancel_extraction,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
