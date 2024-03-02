use tauri::{Manager, Window};

use crate::state::{cnl_state::CNLState, address_state::TcpAddressState};

#[tauri::command]
pub async fn close_splashscreen(window: Window) {
    #[cfg(feature = "logging-invoke")]
    println!("invoke: close_splashscreen()");
    // Close splashscreen

    let splashscreen = window.get_window("splashscreen");
    match splashscreen {
        Some(win) => win.close().unwrap(),
        None => (),
    }
    // Show main window
    window
        .get_window("main")
        .expect("no window labeled 'main' found")
        .show()
        .unwrap();
}

#[tauri::command]
pub async fn open_splashscreen(window: Window, app_handle: tauri::AppHandle, address_state: tauri::State<'_, TcpAddressState>) -> Result<(),()>{
    #[cfg(feature = "logging-invoke")]
    println!("invoke: open_splashscreen()");
    // Open splashscreen
    let splashscreen = window
        .get_window("splashscreen")
        .expect("no window labeled 'splashscreen' found");
    let address = address_state.address.clone();
    if !splashscreen.is_visible().unwrap() {
        splashscreen.show().unwrap();
        tauri::async_runtime::spawn(async move {
            app_handle.manage(CNLState::create("./test.yaml", &app_handle, &address).await);
        });
    }
    Ok(())
}
