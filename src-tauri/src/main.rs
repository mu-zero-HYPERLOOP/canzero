#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;

use crate::{
    commands::{connection_status, network_information, object_entry_commands},
    state::cnl_state::CNLState,
};

mod cnl;
mod commands;
mod notification;
mod state;

#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() {
    let _ = fix_path_env::fix();
    tauri::async_runtime::set(tokio::runtime::Handle::current());
    println!("Hello, World!");
    // setup tauri
    tauri::Builder::default()
        .setup(|app| {
            println!("Hello, Tauri!");
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                app_handle.manage(CNLState::create("./test.yaml", &app_handle));
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::commands::emergency,
            commands::commands::launch_pod,
            commands::commands::land_pod,
            commands::commands::connect_pod,
            commands::trace::listen_to_trace,
            commands::trace::unlisten_from_trace,
            commands::trace::sort_trace_by,
            commands::trace::filter_trace_by,
            network_information::network_information,
            network_information::node_information,
            network_information::object_entry_information,
            network_information::command_information,
            object_entry_commands::listen_to_latest_object_entry_value,
            object_entry_commands::unlisten_from_latest_object_entry_value,
            object_entry_commands::listen_to_history_of_object_entry,
            object_entry_commands::unlisten_from_history_of_object_entry,
            object_entry_commands::request_object_entry_value,
            object_entry_commands::set_object_entry_value,
            connection_status::get_connection_status,
            commands::node_commands::listen_to_node_latest,
            commands::node_commands::unlisten_from_node_latest,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
