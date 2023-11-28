#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use rand::{rngs::StdRng, Rng, SeedableRng};
use serde::Serialize;
use std::time::Duration;
use tauri::Manager;

use crate::{
    commands::{
        network_information,
        trace::{listen_to_trace, unlisten_to_trace},
    },
    state::cnl_state::CNLState,
};

mod cnl;
mod commands;
mod observers;
mod state;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn emergency() {
    println!("Emergency")
    //TODO: Emergency behaviour
}

#[tauri::command]
fn launch_pod() {
    println!("Launch")
    //TODO: launch_pod behaviour
}

#[tauri::command]
fn land_pod() {
    println!("Land")
    //TODO: stop_pod behaviourany
}

#[tauri::command]
fn connect_pod() {
    println!("Connect")
}

#[derive(Serialize)]
struct InitialGraphData {
    values: Vec<Graphable>,
}

#[derive(Serialize, Clone)]
struct Graphable {
    x: f64,
    y: f64,
}

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
            emergency,
            launch_pod,
            land_pod,
            connect_pod,
            listen_to_trace,
            unlisten_to_trace,
            network_information::network_information,
            network_information::node_information,
            network_information::object_entry_information,
            network_information::command_information,
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
