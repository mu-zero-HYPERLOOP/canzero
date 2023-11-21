#[cfg(feature = "socket-can")]
mod can;

#[cfg(feature = "mock-can")]
mod mock_can;

mod can_frame;
pub mod frame;
mod handler;
pub mod network;
pub mod parser;
mod rx;
pub mod trace;

use std::sync::Arc;

use self::{rx::RxCom, trace::TraceObject};

use can_config_rs::config;

#[cfg(feature = "socket-can")]
pub type CAN = can::CAN;

#[cfg(feature = "mock-can")]
pub type CAN = mock_can::MockCan;

// CaNetwork Layer
pub struct CNL {
    can0: Arc<CAN>,
    can1: Arc<CAN>,
    trace : Arc<TraceObject>,
    rx: RxCom,
}

impl CNL {
    pub fn create(network_config: &config::NetworkRef, app_handle: &tauri::AppHandle) -> Self {
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

        let trace = Arc::new(TraceObject::create(app_handle));

        let rx = RxCom::create(network_config, &trace);
        Self { can0, can1, rx, trace}
    }
    pub fn start(&mut self) {
        self.rx.start(&self.can0);
        self.rx.start(&self.can1);
    }

    pub fn trace(&self) -> &Arc<TraceObject> {
        &self.trace
    }
}
