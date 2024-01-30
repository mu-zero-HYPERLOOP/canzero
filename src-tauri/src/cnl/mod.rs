pub mod command;
pub mod connection;
pub mod errors;
pub mod frame;
mod handler;
pub mod network;
pub mod parser;
mod rx;
pub mod trace;
mod tx;

pub mod can_adapter;

use std::sync::Arc;

use crate::notification::NotificationStream;

use self::{
    can_adapter::CanAdapter,
    command::Command,
    connection::{ConnectionObject, ConnectionStatus},
    network::{node_object::NodeObject, NetworkObject},
    rx::RxCom,
    trace::TraceObject,
    tx::TxCom,
};

use can_config_rs::config;

// Can Network Layer (CNL)
pub struct CNL {
    can_buses: Vec<Arc<CanAdapter>>,
    trace: Arc<TraceObject>,
    rx: RxCom,
    // TODO remove allow dead_code before release!
    #[allow(dead_code)]
    tx: Arc<TxCom>,
    network: Arc<NetworkObject>,
    notification_stream: NotificationStream,
    connection_object: Arc<ConnectionObject>,
}

impl CNL {
    pub fn create(network_config: &config::NetworkRef, app_handle: &tauri::AppHandle) -> Self {
        let connection_object =
            ConnectionObject::new(ConnectionStatus::CanDisconnected, app_handle);

        let can_buses = network_config
            .buses()
            .iter()
            .map(|bus_config| Arc::new(CanAdapter::create(bus_config, network_config)))
            .collect();

        connection_object.set_status(ConnectionStatus::CanConnected);

        let trace = Arc::new(TraceObject::create(app_handle));

        let tx = Arc::new(TxCom::create(network_config.clone()));

        let network = Arc::new(NetworkObject::create(
            network_config,
            app_handle,
            tx.clone(),
        ));

        let rx = RxCom::create(network_config, &trace, &network, app_handle);
        Self {
            can_buses,
            rx,
            tx,
            trace,
            network,
            notification_stream: NotificationStream::new(&app_handle),
            connection_object: Arc::new(connection_object),
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
