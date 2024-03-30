use std::net::SocketAddr;

use can_config_rs::config::NetworkRef;
use libc::WSTOPSIG;
use tokio::sync::Mutex;

use crate::cnl::can_adapter::CanAdapter;

use super::cnl_state::CNLState;



#[derive(Debug, Clone)]
pub enum NetworkConnectionCreateInfo {
    Tcp(SocketAddr),
    SocketCan,
}

pub struct StartupState {
    network_config : Mutex<Option<NetworkRef>>,
    connections : Mutex<Vec<NetworkConnectionCreateInfo>>,

    established_connection : Mutex<Option<Vec<CanAdapter>>>,
}

impl StartupState {
    pub fn new() -> Self {
        StartupState {
            network_config : Mutex::new(None),
            connections : Mutex::new(vec![]),
            established_connection : Mutex::new(None),
        }
    }

    pub async fn reset_network_config(&self) {
        *self.network_config.lock().await = None;
    }

    pub async fn set_network_config(&self, network_config : NetworkRef) { 
        *self.network_config.lock().await = Some(network_config);
    }

    pub async fn set_connections(&self, connections : Vec<NetworkConnectionCreateInfo>) {
        *self.connections.lock().await = connections;
    }

    pub async fn reset_connections(&self) {
        *self.connections.lock().await = vec![];
    }

    pub async fn try_connect(&self, connection_index : usize) -> Result<(), String>{
        let connections_lock = self.connections.lock().await;
        let Some(connection) = connections_lock.get(connection_index) else {
            return Err("Fatal Error invalid connection index".to_owned());
        };
        match connection {
            NetworkConnectionCreateInfo::Tcp(socket_addr) => {
                println!("TODO! Connecting to {socket_addr}");
                return Err("Not implemented!".to_owned());
            },
            NetworkConnectionCreateInfo::SocketCan => {
                println!("TODO Connecting to SocketCAN");
                return Err("Not implemented!".to_owned());
            },
        }
    }

    pub async fn complete_setup(&self, app_handle : &tauri::AppHandle) -> CNLState {
        todo!("complete_setup not implememented yet");
        // CNLState::create(self.network_config.lock().await.clone(), app_handle, tcp_address)
    }
}
