use std::sync::Mutex;

use serde::Serialize;
use tauri::Manager;

#[derive(Clone, Debug)]
pub enum ConnectionStatus {
    NetworkConnected,
    HeartbeatMiss{
        node_id : u8,
    },
    NetworkDisconnected,
    FrontendWdgTimeout,
    DeadlockWdgTimeout,
}

impl Serialize for ConnectionStatus {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match &self {
            ConnectionStatus::NetworkConnected => serializer.serialize_str("network-connected"),
            ConnectionStatus::HeartbeatMiss{node_id : _} => serializer.serialize_str("heartbeat-miss"),
            ConnectionStatus::NetworkDisconnected => serializer.serialize_str("network-disconnected"),
            ConnectionStatus::FrontendWdgTimeout => serializer.serialize_str("frontend-wdg-timeout"),
            ConnectionStatus::DeadlockWdgTimeout => serializer.serialize_str("deadlock-wdg-timeout"),
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
        app_handle
            .emit_all(CONNECTION_STATUS_EVENT_NAME, status)
            .expect("failed to transmit connection status to frontend");
    }

    pub async fn deadlock_watchdog(&self) {
        let _x = self.connection_status.lock().unwrap();
    }
}
