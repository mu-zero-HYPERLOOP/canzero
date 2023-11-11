// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::{rngs::StdRng, Rng, SeedableRng};
use std::{time::Duration};
use tauri::Manager;
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

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            random_integer(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
