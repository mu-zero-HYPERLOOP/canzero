#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;

use crate::{
    commands::{connection_status, network_information, object_entry_commands},
    state::{cnl_state::CNLState, address_state::TcpAddressState},
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
            let address = match app.get_cli_matches() {
                Ok(matches) => {
                    let address = matches.args.get("address");
                    println!("{address:?}");
                    match address {
                        Some(arg_data) => match &arg_data.value {
                            serde_json::Value::String(address) => address.clone(),
                            _ => "127.0.0.1:50000".to_owned(),
                        },
                        None => "127.0.0.1:50000".to_owned(),
                    }
                }
                Err(_) => "127.0.0.1:50000".to_owned(),
            };
            tauri::async_runtime::spawn(async move {
                app_handle.manage(TcpAddressState::new(&address));
            });
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
            commands::node_commands::listen_to_node_latest,
            commands::node_commands::unlisten_from_node_latest,
            commands::export::export,
            commands::splashscreen::close_splashscreen,
            commands::splashscreen::open_splashscreen,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
