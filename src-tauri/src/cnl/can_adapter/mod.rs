use std::net::SocketAddr;

use can_config_rs::config::{bus::BusRef, NetworkRef};

use self::{can_error::TCanError, can_frame::{CanFrame, TCanFrame}};

pub mod can_error;
pub mod can_frame;
pub mod timestamped;

#[cfg(feature = "foo")]
mod socket_can;

mod tcp;

pub struct CanAdapter {
    bus : BusRef,
    imp : CanAdapterImpl,
}

pub enum CanAdapterImpl {
    TcpCanAdapter(),
    SocketCanAdapter(),
}


impl CanAdapter {
    pub fn create_tcp_adapters(network_config : &NetworkRef, sockaddr : SocketAddr) -> std::io::Result<Vec<Self>> {
        let mut adapters = vec![];
        for bus in network_config.buses() {
            //TODO 
            adapters.push(Self{
                bus : bus.clone(),
                imp : CanAdapterImpl::TcpCanAdapter()
            });
        }
        Ok(adapters)
    }

    pub fn create_socketcan_adapters(network_config : &NetworkRef) -> std::io::Result<Vec<Self>> {
        let mut adapters = vec![];
        for bus in network_config.buses() {
            //TODO 
            adapters.push(Self{
                bus : bus.clone(),
                imp : CanAdapterImpl::SocketCanAdapter()
            });
        }
        Ok(adapters)
    }


    pub async fn receive(&self) -> Result<TCanFrame, TCanError> {
        match &self.imp {
            CanAdapterImpl::TcpCanAdapter() => todo!(),
            CanAdapterImpl::SocketCanAdapter() => todo!(),
        }
    }

    pub async fn receive_err(&self) -> TCanError {
        match &self.imp {
            CanAdapterImpl::TcpCanAdapter() => todo!(),
            CanAdapterImpl::SocketCanAdapter() => todo!(),
        }
    }

    pub async fn send(&self, frame: CanFrame) {
        match &self.imp {
            CanAdapterImpl::TcpCanAdapter() => todo!(),
            CanAdapterImpl::SocketCanAdapter() => todo!(),
        }
    }

    pub fn bus(&self) -> &BusRef {
        &self.bus
    }
}


