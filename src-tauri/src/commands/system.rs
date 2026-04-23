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
    let sbk_version = std::process::Command::new("sbk")
        .arg("--version")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|s| s.split_whitespace().last().map(|v| v.trim().to_string()))
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| env!("SBK_VERSION").to_string());

    (env!("CARGO_PKG_VERSION").to_string(), sbk_version)
}
