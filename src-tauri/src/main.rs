// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::{rngs::StdRng, Rng, SeedableRng};
use std::time::Duration;
use tauri::Manager;
use serde::Serialize;

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
    //TODO: stop_pod behaviour
}

#[tauri::command]
fn connect_pod() {
    println!("Connect")
    //TODO: connect_pod behaviour
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
    println!("get_graph_data was invoked");
    InitialGraphData {
        values : (1..=500)
            .map(|n| Graphable { x: f64::from(n),  y: 0f64 })
            .collect(),
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            random_integer(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
                        emergency, 
                        launch_pod, land_pod, connect_pod, initialize_graph])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}

fn random_integer(app_handle: tauri::AppHandle) {

    let mut x: f64 = 201.0;
    tauri::async_runtime::spawn(async move {
        let mut rng = {
            let rng = rand::thread_rng();
            StdRng::from_rng(rng).unwrap()
        };
        loop {
            tokio::time::sleep(Duration::from_millis(5)).await;
            let y = rng.gen::<u32>();
            println!("emit event : {y}");
            app_handle.emit_all("random-integer", y).unwrap();
            app_handle.emit_all("abcde", Graphable { x: x, y: f64::from(y) }).unwrap();
            x += 1f64;
            println!("emit graphble: x: {x}, y: {y}");
        }
    });
}
