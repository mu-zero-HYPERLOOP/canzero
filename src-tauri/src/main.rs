// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::{rngs::StdRng, Rng, SeedableRng};
use std::{time::Duration};
use tauri::Manager;

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

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            random_integer(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![emergency, launch_pod, land_pod, connect_pod])
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
            println!("emit event : {x}");
            app_handle.emit_all("random-integer", x).unwrap();
        }
    });
}
