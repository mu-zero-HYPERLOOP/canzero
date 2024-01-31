use std::time::Duration;
use crate::state::cnl_state::CNLState;


#[tauri::command]
pub async fn emergency(_state: tauri::State<'_, CNLState>) -> Result<(),()>{
    // state.lock().await.command(Command::Emergency);
    println!("emergency");
    Ok(())
}

#[tauri::command]
pub async fn launch_pod(_state: tauri::State<'_, CNLState>) -> Result<(), ()>{
    // state.lock().await.command(Command::Launch);
    println!("launch pod");
    Ok(())
}

#[tauri::command]
pub async fn land_pod(_state: tauri::State<'_, CNLState>) -> Result<(),()>{
    // state.lock().await.command(Command::Abort);
    println!("land pod!");
    Ok(())
}


#[tauri::command]
pub async fn connect_pod() {
    // NOTE enable heartbeat protocol here and move pod out of 
    tokio::time::sleep(Duration::from_millis(5000)).await;
    println!("Connect")
}
