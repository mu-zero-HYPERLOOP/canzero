#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use rand::{rngs::StdRng, Rng, SeedableRng};
use serde::Serialize;
use std::time::Duration;
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
            random_integer(app.handle());
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
            initialize_graph,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}

fn random_integer(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut rng = {
            let rng = rand::thread_rng();
            StdRng::from_rng(rng).unwrap()
        };
        loop {
            tokio::time::sleep(Duration::from_millis(1000)).await;
            let x = rng.gen::<u32>();
            app_handle.emit_all("random-integer", x).unwrap();
        }
    });
}
