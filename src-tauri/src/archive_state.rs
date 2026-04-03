use crate::types::EntryInfo;
use std::sync::Mutex;

pub struct ArchiveState {
    pub path: Option<String>,
    pub entries: Vec<EntryInfo>,
}

impl Default for ArchiveState {
    fn default() -> Self {
        Self {
            path: None,
            entries: Vec::new(),
        }
    }
}

pub type SharedArchiveState = Mutex<ArchiveState>;
