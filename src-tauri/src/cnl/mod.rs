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
mod tx;
pub mod timestamped;
pub mod trace;

use std::sync::Arc;

use crate::notification::NotificationStream;

use self::{
    command::Command,
    network::{node_object::NodeObject, NetworkObject},
    rx::RxCom,
    trace::TraceObject, connection::{ConnectionObject, ConnectionStatus},
    tx::TxCom,
};

use can_config_rs::config;

#[cfg(feature = "socket-can")]
pub type CanAdapter = can::SocketCanAdapter;

//#[cfg(feature = "mock-can")]
//pub type CanAdapter = mock_can::MockCan;

// CaNetwork Layer
pub struct CNL {
    can_adapters : Vec<Arc<CanAdapter>>,
    trace: Arc<TraceObject>,
    rx: RxCom,
    tx: Arc<TxCom>,
    network: Arc<NetworkObject>,
    notification_stream: NotificationStream,
    connection_object : Arc<ConnectionObject>,
}

impl CNL {
    pub fn create(network_config: &config::NetworkRef, app_handle: &tauri::AppHandle) -> Self {
    
        let connection_object = ConnectionObject::new(ConnectionStatus::CanDisconnected, app_handle);

        
        let can_adapters = network_config.buses().iter().map(|bus_config| {
            //#[cfg(feature = "mock-can")]
            //Arc::new(mock_can::MockCan::create(bus_config, network_config))

            #[cfg(feature = "socket-can")]
            Arc::new(can::SocketCanAdapter::create(true, bus_config).expect("could not create can adapter"))
        }).collect();
        println!("hey1");

        connection_object.set_status(ConnectionStatus::CanConnected);
        println!("hey2");

        let trace = Arc::new(TraceObject::create(app_handle));
        println!("hey2");

        let tx = Arc::new(TxCom::create(&network_config, &can_adapters));
        println!("hey2");

        let network = Arc::new(NetworkObject::create(network_config, app_handle, tx.clone()));
        println!("hey2");

        let rx = RxCom::create(network_config, &trace, &network, app_handle);
        Self {
            can_adapters,
            rx,
            tx,
            trace,
            network,
            notification_stream: NotificationStream::new(&app_handle),
            connection_object : Arc::new(connection_object),
        }
    }
    pub fn start(&mut self) {
        for can_bus in &self.can_adapters {
            self.rx.start(can_bus);
        }
    }

    pub fn trace(&self) -> &Arc<TraceObject> {
        &self.trace
    }

    pub fn nodes(&self) -> &Vec<Arc<NodeObject>> {
        self.network.nodes()
    }

    pub fn can_adapters(&self) -> &Vec<Arc<CanAdapter>> {
        &self.can_adapters
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
