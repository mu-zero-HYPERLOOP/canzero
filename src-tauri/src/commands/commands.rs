use crate::{state::cnl_state::CNLState, cnl::command::Command};


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
pub async fn emergency(state: tauri::State<'_, CNLState>) -> Result<(),()>{
    state.lock().await.command(Command::Emergency);
    Ok(())
}

#[tauri::command]
pub async fn launch_pod(state: tauri::State<'_, CNLState>) -> Result<(), ()>{
    state.lock().await.command(Command::Launch);
    Ok(())
}

#[tauri::command]
pub async fn land_pod(state: tauri::State<'_, CNLState>) -> Result<(),()>{
    state.lock().await.command(Command::Abort);
    Ok(())
}
