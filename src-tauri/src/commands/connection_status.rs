use std::sync::Arc;

use crate::{cnl::connection::{ConnectionStatus, ConnectionObject}, state::cnl_state::CNLState};


#[tauri::command]
pub async fn get_connection_status(state: tauri::State<'_, CNLState>) -> Result<ConnectionStatus, ()> {
    #[cfg(feature = "logging-invoke")]
    println!("invoke: get_connection_status");
    let cnl = state.lock().await;
    let connection_object : &Arc<ConnectionObject> = cnl.connection_object();
    let connection_status = connection_object.get_status();
    Ok(connection_status)
}
