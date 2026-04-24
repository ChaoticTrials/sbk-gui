pub mod archive;
pub mod cancel;
pub mod extract;
pub mod extract_here;
pub mod open;
pub mod system;
pub mod verify;

/// Rewrite a JSON file in pretty-printed form in place.
pub(crate) fn prettify_json_file(path: &std::path::Path) {
    if let Ok(data) = std::fs::read(path) {
        if let Ok(value) = serde_json::from_slice::<serde_json::Value>(&data) {
            if let Ok(pretty) = serde_json::to_string_pretty(&value) {
                let _ = std::fs::write(path, pretty.as_bytes());
            }
        }
    }
}

/// Recursively prettify all `.json` files under `dir`.
pub(crate) fn walk_and_prettify(dir: &std::path::Path) {
    if let Ok(rd) = std::fs::read_dir(dir) {
        for entry in rd.flatten() {
            let p = entry.path();
            if p.is_dir() {
                walk_and_prettify(&p);
            } else if p
                .extension()
                .map_or(false, |e| e.eq_ignore_ascii_case("json"))
            {
                prettify_json_file(&p);
            }
        }
    }
}
