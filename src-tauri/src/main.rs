#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;

use crate::{commands::{connection_status, network_information, object_entry_commands}, state::startup::StartupState};

mod cnl;
mod commands;
mod notification;
mod state;

#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() {
    let _ = fix_path_env::fix();
    tauri::async_runtime::set(tokio::runtime::Handle::current());
    // setup tauri
    tauri::Builder::default()
        .setup(|app| {
            app.app_handle().manage(StartupState::new());
            tauri::WindowBuilder::new(
                app,
                "startup",
                tauri::WindowUrl::App("startup.html".into()),
            ).center()
            .title("CANzero-Startup")
            .decorations(false)
            .resizable(false)
            .inner_size(960f64, 540f64)
            .build()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
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
            connection_status::heartbeat,
            connection_status::restart,
            commands::node_commands::listen_to_node_latest,
            commands::node_commands::unlisten_from_node_latest,
            commands::export::export,
            commands::startup::download_network_configuration,
            commands::startup::discover_servers,
            commands::startup::try_connect,
            commands::startup::complete_setup,
            commands::startup::close_startup,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
