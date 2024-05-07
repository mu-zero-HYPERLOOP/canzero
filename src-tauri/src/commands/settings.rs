use canzero_appdata::AppData;
use tauri::{api::dialog::FileDialogBuilder, Manager};

#[tauri::command]
pub fn open_settings(app_handle: tauri::AppHandle) {
    let None = app_handle.get_window("settings") else {
        return;
    };

    tauri::WindowBuilder::new(
        &app_handle,
        "settings",
        tauri::WindowUrl::App("settings.html".into()),
    )
    .center()
    .title("CANzero settings")
    .inner_size(600f64, 400f64)
    .resizable(false)
    .visible(true)
    .build()
    .unwrap();
}

#[tauri::command]
pub fn close_settings(app_handle: tauri::AppHandle) {
    match app_handle.get_window("settings") {
        Some(win) => win.close().unwrap(),
        None => (),
    }
}

#[tauri::command]
pub fn select_network_configuration() {
    FileDialogBuilder::new().pick_file(|path| match path {
        Some(path) => {
            let mut appdata = AppData::read().unwrap();
            appdata.set_config_path(Some(path)).unwrap();
            drop(appdata);
        }
        None => (),
    });
}
