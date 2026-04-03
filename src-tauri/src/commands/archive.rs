use sbk::{
    codec,
    format::{frame_dir::read_frame_dir, header::read_header, index::read_index},
};
use std::{
    fs::File,
    io::{Seek, SeekFrom},
};
use tauri::State;

use crate::{archive_state::SharedArchiveState, types::*};

#[tauri::command]
pub fn open_archive(
    path: String,
    state: State<SharedArchiveState>,
) -> Result<OpenArchiveResult, String> {
    let mut f = File::open(&path).map_err(|e| e.to_string())?;
    let header = read_header(&mut f).map_err(|e| e.to_string())?;
    let codec = codec::from_algorithm(header.algorithm);

    f.seek(SeekFrom::Start(header.frame_dir_offset))
        .map_err(|e| e.to_string())?;
    let frame_dir = read_frame_dir(&mut f).map_err(|e| e.to_string())?;

    f.seek(SeekFrom::Start(header.index_offset))
        .map_err(|e| e.to_string())?;
    let raw_entries = read_index(
        &mut f,
        &*codec,
        header.index_compressed_size,
        header.index_checksum,
    )
    .map_err(|e| e.to_string())?;

    let total_original_size: u64 = raw_entries.iter().map(|e| e.original_size).sum();
    let total_compressed_size: u64 = frame_dir
        .groups
        .iter()
        .flat_map(|g| g.iter())
        .map(|fe| fe.frame_compressed_sz as u64)
        .sum();

    let entries: Vec<EntryInfo> = raw_entries
        .iter()
        .map(|e| EntryInfo {
            path: e.path.clone(),
            mtime_ms: e.mtime_ms,
            group_id: e.group_id,
            original_size: e.original_size,
        })
        .collect();

    let info = ArchiveInfo {
        path: path.clone(),
        format_version: header.format_version,
        algorithm: header.algorithm.to_string(),
        file_count: header.file_count,
        frame_size_bytes: header.frame_size_bytes,
        total_original_size,
        total_compressed_size,
    };

    let mut guard = state.lock().unwrap();
    guard.path = Some(path);
    guard.entries = entries.clone();

    Ok(OpenArchiveResult { info, entries })
}

#[tauri::command]
pub fn close_archive(state: State<SharedArchiveState>) {
    let mut guard = state.lock().unwrap();
    guard.path = None;
    guard.entries = Vec::new();
}
