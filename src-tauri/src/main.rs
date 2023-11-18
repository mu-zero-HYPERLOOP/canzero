// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use can::frame::Frame;
use rand::{rngs::StdRng, Rng, SeedableRng};
use stream_object::StreamObject;
use std::{time::Duration};
use serialize::serialized_frame::SerializedFrame;
use tauri::Manager;

use crate::can::CNL;

mod can;
mod serialize;
mod stream_object;

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
fn listen_to_trace(state : tauri::State<TraceState>) -> Vec<SerializedFrame>{
    state.trace_so.listen()
}

#[tauri::command]
fn unlisten_to_trace(state : tauri::State<TraceState>) {
    state.trace_so.unlisten()
}

struct TraceState {
    trace_so : StreamObject<SerializedFrame>,
}

impl TraceState {
    pub fn new() -> Self {
        Self {
            trace_so : StreamObject::new("trace", vec![]),
        }
    }
}

fn main() {
    println!("Hello, World!");
    // setup tauri
    tauri::Builder::default()
        .manage(TraceState::new())
        .invoke_handler(tauri::generate_handler![emergency, launch_pod, land_pod, connect_pod])
        .setup(|app| {
            println!("Hello, Tauri!");
            random_integer(app.handle());
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                // read config
                let network =
                    can_yaml_config_rs::parse_yaml_config_from_file("./test.yaml").unwrap();
                // start CaNetwork Layer
                let mut cnl = CNL::create(&network);
                cnl.start();

                loop {
                    let frame = cnl.get_rx_message_receiver().recv().await.unwrap();
                    app_handle.state::<TraceState>().trace_so.push_value(&app_handle, SerializedFrame::from(frame));
                }
            });
            Ok(())
        })
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
