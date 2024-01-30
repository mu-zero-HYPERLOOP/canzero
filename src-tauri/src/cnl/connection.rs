use std::sync::Mutex;

use serde::Serialize;
use tauri::Manager;

#[derive(Clone, Debug)]
pub enum ConnectionStatus {
    // in this state the CNL is connected to a CAN bus, but no heartbeats are
    // received from the system.
    CanConnected,

    // Here it is connected to the CAN buses and heartbeats are received
    // TODO remove allow dead code before release!
    #[allow(dead_code)]
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

const CONNECTION_STATUS_EVENT_NAME: &str = "connection-status";

pub struct ConnectionObject {
    connection_status: Mutex<ConnectionStatus>,
    app_handle: tauri::AppHandle,
}

impl ConnectionObject {
    pub fn new(connection_status: ConnectionStatus, app_handle: &tauri::AppHandle) -> Self {
        // broadcast inital state!
        Self::emit_event(app_handle, &connection_status);
        Self {
            connection_status: Mutex::new(connection_status),
            app_handle: app_handle.clone(),
        }
    }
    pub fn set_status(&self, connection_status: ConnectionStatus) {
        *self
            .connection_status
            .lock()
            .expect("failed to acquire connection status lock") = connection_status;
        Self::emit_event(
            &self.app_handle,
            &self.connection_status
                .lock()
                .expect("failed to acquire connection status lock"),
        );
    }
    pub fn get_status(&self) -> ConnectionStatus {
        self.connection_status
            .lock()
            .expect("failed to acquire connection status lock")
            .clone()
    }
    fn emit_event(app_handle: &tauri::AppHandle, status: &ConnectionStatus) {
        println!("emit {CONNECTION_STATUS_EVENT_NAME} with payload {status:?}");
        app_handle
            .emit_all(CONNECTION_STATUS_EVENT_NAME, status)
            .expect("failed to transmit connection status to frontend");
    }
}
