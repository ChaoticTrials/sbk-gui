use serde::{Deserialize, Serialize};

/// Serialisable mirror of sbk::format::header::Header + frame dir summary.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArchiveInfo {
    pub path: String,
    pub format_version: u8,
    pub algorithm: String, // "lzma2" or "zstd"
    pub file_count: u64,
    pub frame_size_bytes: u64,
    pub total_original_size: u64,
    pub total_compressed_size: u64,
}

/// Serialisable mirror of sbk::format::index::IndexEntry.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntryInfo {
    pub path: String,
    pub mtime_ms: i64,
    pub group_id: u8,
    pub original_size: u64,
}

/// Payload emitted with every "extraction-progress" event.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractionProgress {
    pub phase: String, // "decompress", "decode", "write"
    pub completed: usize,
    pub total: usize,
}

/// Result of open_archive command.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenArchiveResult {
    pub info: ArchiveInfo,
    pub entries: Vec<EntryInfo>,
}
