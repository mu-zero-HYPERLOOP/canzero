#[cfg(feature = "socket-can")]
mod can;

#[cfg(feature = "mock-can")]
mod mock_can;

pub mod connection;
mod can_frame;
pub mod command;
pub mod errors;
pub mod frame;
mod handler;
pub mod network;
pub mod parser;
mod rx;
pub mod timestamped;
pub mod trace;

use std::sync::Arc;

use crate::notification::NotificationStream;

use self::{
    command::Command,
    network::{node_object::NodeObject, NetworkObject},
    rx::RxCom,
    trace::TraceObject, connection::{ConnectionObject, ConnectionStatus},
};

use can_config_rs::config;

#[cfg(feature = "socket-can")]
pub type CAN = can::CAN;

#[cfg(feature = "mock-can")]
pub type CAN = mock_can::MockCan;

// CaNetwork Layer
pub struct CNL {
    can_buses : Vec<Arc<CAN>>,
    trace: Arc<TraceObject>,
    rx: RxCom,
    network: Arc<NetworkObject>,
    notification_stream: NotificationStream,
    connection_object : Arc<ConnectionObject>,
}

impl CNL {
    pub fn create(network_config: &config::NetworkRef, app_handle: &tauri::AppHandle) -> Self {
    
        let connection_object = ConnectionObject::new(ConnectionStatus::CanDisconnected, app_handle);

        
        let can_buses = network_config.buses().iter().map(|bus_config| {
            #[cfg(feature = "mock-can")]
            Arc::new(mock_can::MockCan::create(bus_config, network_config))
        }).collect();

        connection_object.set_status(ConnectionStatus::CanConnected);

        let trace = Arc::new(TraceObject::create(app_handle));

        let network = Arc::new(NetworkObject::create(network_config, app_handle));

        let rx = RxCom::create(network_config, &trace, &network, app_handle);
        Self {
            can_buses,
            rx,
            trace,
            network,
            notification_stream: NotificationStream::new(&app_handle),
            connection_object : Arc::new(connection_object),
        }
    }
    pub fn start(&mut self) {
        for can_bus in &self.can_buses {
            self.rx.start(can_bus);
        }
    }

    pub fn trace(&self) -> &Arc<TraceObject> {
        &self.trace
    }

    pub fn nodes(&self) -> &Vec<Arc<NodeObject>> {
        self.network.nodes()
    }

    pub fn command(&self, command: Command) {
        match &command {
            Command::Emergency => self.notification_stream.notify_error(
                "Unimplemented",
                "The command emergency is not yet implemented",
            ),
            Command::Launch => self
                .notification_stream
                .notify_error("Unimplemented", "The command launch is not yet implemented"),
            Command::Abort => self
                .notification_stream
                .notify_error("Unimplemented", "The command abort is not yet implemented"),
        }
    }
    pub fn connection_object(&self) -> &Arc<ConnectionObject> {
        &self.connection_object
    }
}
