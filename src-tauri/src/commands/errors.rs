use crate::{cnl::error_observable::ErrorEvent, state::cnl_state::CNLState};


#[tauri::command]
pub async fn listen_to_errors(state: tauri::State<'_, CNLState>) -> Result<Vec<ErrorEvent>, ()> {
    let cnl = state.lock().await;

    let current = cnl.error_observable().current().await;
    cnl.error_observable().listen().await;
    Ok(current)
}

#[tauri::command]
pub async fn unlisten_from_errors(state : tauri::State<'_, CNLState>) -> Result<(),()> {
    let cnl = state.lock().await;
    cnl.error_observable().unlisten().await;
    Ok(())
}
