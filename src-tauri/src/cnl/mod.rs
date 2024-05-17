pub mod connection;
mod deserialize;
pub mod errors;
pub mod frame;
mod handler;
pub mod network;
mod rx;
pub mod trace;
mod tx;
mod watchdog;

pub mod can_adapter;

use std::{
    sync::Arc,
    time::{Duration, Instant},
};

use self::{
    can_adapter::CanAdapter,
    connection::{ConnectionObject, ConnectionStatus},
    network::{node_object::NodeObject, NetworkObject},
    rx::RxCom,
    trace::TraceObject,
    tx::TxCom,
    watchdog::{Watchdog, WatchdogOverlord, WdgTag},
};

use canzero_config::config;

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

    _watchdog_overlord: WatchdogOverlord,
    external_watchdog: Watchdog,
}

impl CNL {
    pub async fn create(
        network_config: &config::NetworkRef,
        app_handle: &tauri::AppHandle,
        can_adapters: Vec<Arc<CanAdapter>>,
        timebase: Instant,
        node_id : Option<u8>,
    ) -> Self {
        let connection_object = Arc::new(ConnectionObject::new(
            ConnectionStatus::NetworkConnected,
            app_handle,
        ));

        let node_id = node_id.unwrap_or(network_config.nodes().len() as u8);

        let trace = Arc::new(TraceObject::create(app_handle));

        let tx = Arc::new(TxCom::create(
            &network_config,
            &can_adapters,
            &trace,
            timebase,
            &connection_object,
            node_id, 
        ));

        let watchdog_overlord = WatchdogOverlord::new(&connection_object);

        let network = Arc::new(NetworkObject::create(
            network_config,
            app_handle,
            tx.clone(),
            timebase,
            &watchdog_overlord
        ));

        let rx = RxCom::create(
            network_config,
            &trace,
            &network,
            app_handle,
            &can_adapters,
            &connection_object,
            node_id,
        );
            
        // disable the frontend heartbeat only for release
        let external_watchdog =
            watchdog_overlord.register(WdgTag::FrontendWdg, Duration::from_millis(1000));

        let deadlock_watchdog =
            watchdog_overlord.register(WdgTag::DeadlockWdg, Duration::from_millis(1000));

        let network_dead = network.clone();
        let trace_dead = trace.clone();
        let connection_object_dead = connection_object.clone();
        tokio::spawn(async move {
            let mut deadlock_interval = tokio::time::interval(Duration::from_millis(200));
            loop {
                deadlock_interval.tick().await;
                network_dead.deadlock_watchdog().await;
                trace_dead.deadlock_watchdog().await;
                connection_object_dead.deadlock_watchdog().await;
                deadlock_watchdog.reset(false).await;
            }
        });

        Self {
            rx,
            tx,
            trace,
            network,
            connection_object,
            _watchdog_overlord: watchdog_overlord,

            external_watchdog,
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

    pub async fn reset_watchdog(&self) {
        #[cfg(not(debug_assertions))]
        self.external_watchdog.reset(false).await;
    }
}
