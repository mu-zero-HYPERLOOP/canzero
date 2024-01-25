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
    can0: Arc<CAN>,
    can1: Arc<CAN>,
    trace: Arc<TraceObject>,
    rx: RxCom,
    network: Arc<NetworkObject>,
    baudrate: u32,
    notification_stream: NotificationStream,
    connection_object : ConnectionObject,
}

impl CNL {
    pub fn create(network_config: &config::NetworkRef, app_handle: &tauri::AppHandle) -> Self {
    
        let connection_object = ConnectionObject::new(ConnectionStatus::CanDisconnected, app_handle);

        #[cfg(feature = "socket-can")]
        let can0 =
            Arc::new(can::CAN::create(can::CanModule::CAN0, true).expect("failed to setup can0"));
        #[cfg(feature = "socket-can")]
        let can1 =
            Arc::new(can::CAN::create(can::CanModule::CAN1, true).expect("failed to setup can1"));
        #[cfg(feature = "mock-can")]
        let can0 = Arc::new(mock_can::MockCan::create(network_config));
        #[cfg(feature = "mock-can")]
        let can1 = Arc::new(mock_can::MockCan::create(network_config));

        connection_object.set_status(ConnectionStatus::CanConnected);

        let trace = Arc::new(TraceObject::create(app_handle));

        let network = Arc::new(NetworkObject::create(network_config, app_handle));

        let rx = RxCom::create(network_config, &trace, &network, app_handle);
        Self {
            can0,
            can1,
            rx,
            trace,
            network,
            baudrate: network_config.baudrate(),
            notification_stream: NotificationStream::new(&app_handle),
            connection_object,
        }
    }
    pub fn start(&mut self) {
        self.rx.start(&self.can0);
        #[cfg(feature = "socket-can")]
        self.rx.start(&self.can1);
    }

    pub fn trace(&self) -> &Arc<TraceObject> {
        &self.trace
    }

    pub fn nodes(&self) -> &Vec<Arc<NodeObject>> {
        self.network.nodes()
    }
    pub fn baudrate(&self) -> u32 {
        self.baudrate
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
}
