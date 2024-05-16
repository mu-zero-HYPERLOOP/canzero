use std::sync::Arc;

use crate::{cnl::connection::{ConnectionStatus, ConnectionObject}, state::cnl_state::CNLState};


#[tauri::command]
pub async fn get_connection_status(state: tauri::State<'_, CNLState>) -> Result<ConnectionStatus, ()> {
    let cnl = state.lock().await;
    let connection_object : &Arc<ConnectionObject> = cnl.connection_object();
    let connection_status = connection_object.get_status();
    Ok(connection_status)
}

#[tauri::command]
pub async fn heartbeat(state : tauri::State<'_, CNLState>) -> Result<(),()> {

    #[cfg(not(debug_assertions))]
    state.lock().await.reset_watchdog().await;   

    Ok(())
}

#[tauri::command]
pub fn restart(app_handle : tauri::AppHandle) {
    println!("Restarting...");
    app_handle.restart();
}

#[tauri::command]
pub fn close(app_handle : tauri::AppHandle) {
    println!("Closing...");
    app_handle.exit(0);
}
