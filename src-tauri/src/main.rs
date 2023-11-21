#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{cell::Cell, ops::Deref, sync::Arc, time::Duration};

use can::trace::TraceObjectEvent;
use rand::{rngs::StdRng, Rng, SeedableRng};
use serialize::serialized_frame::SerializedFrame;
use tauri::Manager;
use tokio::sync::Mutex;

use crate::can::CNL;

mod can;
mod observers;
mod serialize;

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
    //TODO: stop_pod behaviour
}

#[tauri::command]
fn connect_pod() {
    println!("Connect")
}

#[tauri::command]
async fn listen_to_trace(state: tauri::State<'_, CNLState>) -> Result<Vec<TraceObjectEvent>, ()> {
    println!("listen to trace");
    let trace = state.lock().await.trace().clone();
    trace.listen();
    Ok(trace.get())
}

#[tauri::command]
async fn unlisten_to_trace(state: tauri::State<'_, CNLState>) -> Result<(), ()> {
    println!("unlisten from trace");
    state
        .lock()
        .await
        .trace()
        .unlisten()
        .await;
    Ok(())
}

struct CNLState {
    pub cnl: Mutex<CNL>,
}

impl Deref for CNLState {
    type Target = Mutex<CNL>;

    fn deref(&self) -> &Self::Target {
        &self.cnl
    }
}

impl CNLState {
    pub fn create(config_path: &str, app_handle: &tauri::AppHandle) -> Self {
        let network_config = can_yaml_config_rs::parse_yaml_config_from_file(config_path).unwrap();
        let mut cnl = CNL::create(&network_config, app_handle);
        cnl.start();
        Self {
            cnl: Mutex::new(cnl),
        }
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
            unlisten_to_trace
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
