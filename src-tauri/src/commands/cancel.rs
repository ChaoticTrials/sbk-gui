use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};
use tauri::State;

pub struct CancellationState(pub Arc<AtomicBool>);

impl Default for CancellationState {
    fn default() -> Self {
        Self(Arc::new(AtomicBool::new(false)))
    }
}

#[tauri::command]
pub fn cancel_extraction(state: State<'_, CancellationState>) {
    state.0.store(true, Ordering::Relaxed);
}
