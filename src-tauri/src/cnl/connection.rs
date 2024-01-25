use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Mutex,
};

use serde::Serialize;
use tauri::Manager;

#[derive(Clone)]
pub enum ConnectionStatus {
    // in this state the CNL is connected to a CAN bus, but no heartbeats are
    // received from the system.
    CanConnected, 

    // Here it is connected to the CAN buses and heartbeats are received 
    NetworkConnected,

    // Here the CAN is disconnected this can basically only happen if 
    // the program panics during initalization of the CAN modules
    CanDisconnected,
}

impl Serialize for ConnectionStatus {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match &self {
            ConnectionStatus::CanConnected => serializer.serialize_str("can-connected"),
            ConnectionStatus::NetworkConnected => serializer.serialize_str("network-connected"),
            ConnectionStatus::CanDisconnected => serializer.serialize_str("can-disconnected"),
        }
    }
}

pub struct ConnectionObject {
    connection_status: Mutex<ConnectionStatus>,
    listen_counter: AtomicUsize,
    app_handle: tauri::AppHandle,
}

impl ConnectionObject {
    pub fn new(connection_status: ConnectionStatus, app_handle: &tauri::AppHandle) -> Self {
        // broadcast inital state!
        app_handle
            .emit_all("connection-status", connection_status.clone())
            .expect("failed to transmit connection status to frontend");
        Self {
            connection_status: Mutex::new(connection_status),
            listen_counter: AtomicUsize::new(0),
            app_handle: app_handle.clone(),
        }
    }
    pub fn set_status(&self, connection_status: ConnectionStatus) {
        *self
            .connection_status
            .lock()
            .expect("failed to acquire connection status lock") = connection_status;
        if self.listen_counter.load(Ordering::SeqCst) > 0 {
            self.app_handle
                .emit_all("connection-status", self.get_status())
                .expect("failed to transmit connection status to frontend");
        }
    }
    pub fn get_status(&self) -> ConnectionStatus {
        self.connection_status
            .lock()
            .expect("failed to acquire connection status lock")
            .clone()
    }
    pub fn listen(&self) {
        self.listen_counter.fetch_add(1, Ordering::SeqCst);
        self.app_handle
            .emit_all("connection-status", self.get_status())
            .expect("failed to transmit connection status to frontend");
    }
    pub fn unlisten(&self) {
        self.listen_counter.fetch_sub(1, Ordering::SeqCst);
    }
}
