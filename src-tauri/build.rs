fn main() {
    tauri_build::build();

    let lock = std::fs::read_to_string("Cargo.lock").unwrap_or_default();
    let mut sbk_version = String::from("unknown");
    let mut in_sbk = false;
    for line in lock.lines() {
        if line == "[[package]]" {
            in_sbk = false;
        }
        if line == "name = \"sbk\"" {
            in_sbk = true;
        }
        if in_sbk && line.starts_with("version = ") {
            sbk_version = line
                .trim_start_matches("version = \"")
                .trim_end_matches('"')
                .to_string();
            break;
        }
    }
    println!("cargo:rustc-env=SBK_VERSION={}", sbk_version);
    println!("cargo:rerun-if-changed=Cargo.lock");
}
