#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use rand::{Rng, SeedableRng};
use serde::Serialize;
use tauri::Manager;

use crate::{
    commands::{
        network_information,
        trace::{listen_to_trace, unlisten_to_trace}, object_entry_commands,
    },
    state::cnl_state::CNLState,
};

mod cnl;
mod commands;
mod observers;
mod state;
mod notification;

#[derive(Serialize)]
struct InitialGraphData {
    values: Vec<Graphable>,
}

#[derive(Serialize, Clone)]
struct Graphable {
    x: f64,
    y: f64,
}

#[allow(unused)]
#[tauri::command]
fn initialize_graph(node_name: String, oe_name: String) -> InitialGraphData {
    InitialGraphData {
        values: (1..=500)
            .map(|n| Graphable {
                x: f64::from(n),
                y: 0f64,
            })
            .collect(),
    }
}

fn main() {
    let _ = fix_path_env::fix();
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
            listen_to_trace,
            unlisten_to_trace,
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
            initialize_graph,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
