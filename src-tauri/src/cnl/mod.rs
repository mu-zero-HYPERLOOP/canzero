pub mod connection;
mod deserialize;
pub mod errors;
pub mod frame;
mod handler;
pub mod network;
mod rx;
pub mod trace;
mod tx;

pub mod can_adapter;

use std::{sync::Arc, time::Instant};

use self::{
    can_adapter::CanAdapter,
    connection::{ConnectionObject, ConnectionStatus},
    network::{node_object::NodeObject, NetworkObject},
    rx::RxCom,
    trace::TraceObject,
    tx::TxCom,
};

use can_config_rs::config;

// Can Network Layer (CNL)
pub struct CNL {
    trace: Arc<TraceObject>,

    // NOTE RxCom is a zero sized struct just here for
    // easier understanding of the hierarchie of the CNL!
    #[allow(dead_code)]
    rx: RxCom,

    // TODO remove allow dead_code before release!
    #[allow(dead_code)]
    tx: Arc<TxCom>,
    network: Arc<NetworkObject>,
    connection_object: Arc<ConnectionObject>,
}

impl CNL {
    pub async fn create(
        network_config: &config::NetworkRef,
        app_handle: &tauri::AppHandle,
        can_adapters: Vec<Arc<CanAdapter>>,
        timebase : Instant,
    ) -> Self {
        let connection_object =
            ConnectionObject::new(ConnectionStatus::CanDisconnected, app_handle);

        connection_object.set_status(ConnectionStatus::CanConnected);

        let trace = Arc::new(TraceObject::create(app_handle));

        let tx = Arc::new(TxCom::create(&network_config, &can_adapters));

        let network = Arc::new(NetworkObject::create(
            network_config,
            app_handle,
            tx.clone(),
            timebase
        ));

        let rx = RxCom::create(network_config, &trace, &network, app_handle, &can_adapters);
        Self {
            rx,
            tx,
            trace,
            network,
            connection_object: Arc::new(connection_object),
        }
    }

    pub fn trace(&self) -> &Arc<TraceObject> {
        &self.trace
    }

    pub fn nodes(&self) -> &Vec<Arc<NodeObject>> {
        self.network.nodes()
    }

    pub fn connection_object(&self) -> &Arc<ConnectionObject> {
        &self.connection_object
    }
}
