#[tauri::command]
pub fn get_cpu_count() -> u32 {
    num_cpus::get() as u32
}

#[tauri::command]
pub fn get_cli_path() -> Option<String> {
    std::env::args().nth(1)
}

#[tauri::command]
pub fn get_version_info() -> (String, String) {
    (
        env!("CARGO_PKG_VERSION").to_string(),
        env!("SBK_VERSION").to_string(),
    )
}
