use std::net::SocketAddr;

use can_config_rs::config::{bus::BusRef, NetworkRef};

use self::tcp::TcpCanAdapter;
use canzero_common::{CanFrame, TCanFrame, TCanError};

#[cfg(feature = "socket-can")]
mod socket_can;

mod tcp;

pub struct CanAdapter {
    bus: BusRef,
    imp: CanAdapterImpl,
}

pub enum CanAdapterImpl {
    TcpCanAdapter(TcpCanAdapter),
    #[cfg(feature = "socket-can")]
    SocketCanAdapter(socket_can::SocketCanAdapter),
}

impl CanAdapter {
    pub async fn create_tcp_adapters(
        network_config: &NetworkRef,
        app_handle: &tauri::AppHandle,
        sockaddr: &SocketAddr,
    ) -> std::io::Result<Vec<Self>> {
        let channels: Vec<(
            tokio::sync::mpsc::Sender<Result<TCanFrame, TCanError>>,
            tokio::sync::mpsc::Receiver<Result<TCanFrame, TCanError>>,
        )> = network_config
            .buses()
            .iter()
            .map(|_| { tokio::sync::mpsc::channel(16) })
            .collect();
        let tx_channels: Vec<tokio::sync::mpsc::Sender<Result<TCanFrame, TCanError>>> = channels
            .iter()
            .map(|(tx, _rx)| tx.clone())
            .collect();
        let tcp_client = std::sync::Arc::new(
            self::tcp::client::TcpClient::create(sockaddr, app_handle, tx_channels).await?,
        );

        let mut adapters = vec![];
        for (bus, (_tx, rx)) in
            network_config.buses().iter().zip(channels.into_iter())
        {
            adapters.push(Self {
                bus: bus.clone(),
                imp: CanAdapterImpl::TcpCanAdapter(TcpCanAdapter::create(
                    tcp_client.clone(),
                    bus.id(),
                    rx,
                )),
            });
        }
        Ok(adapters)
    }

    #[cfg(feature = "socket-can")]
    pub fn create_socketcan_adapters(
        network_config: &NetworkRef,
        app_handle: &tauri::AppHandle,
    ) -> std::io::Result<Vec<Self>> {
        let start_of_run = std::time::Instant::now();
        let mut adapters = vec![];
        for bus in network_config.buses() {
            adapters.push(Self {
                bus: bus.clone(),
                imp: CanAdapterImpl::SocketCanAdapter(socket_can::SocketCanAdapter::create(
                    bus,
                    start_of_run,
                    app_handle,
                )?),
            });
        }
        Ok(adapters)
    }

    pub async fn receive(&self) -> std::io::Result<Result<TCanFrame, TCanError>> {
        match &self.imp {
            CanAdapterImpl::TcpCanAdapter(adapter) => adapter.receive().await,
            #[cfg(feature = "socket-can")]
            CanAdapterImpl::SocketCanAdapter(adapter) => adapter.receive().await,
        }
    }

    pub async fn send(&self, frame: CanFrame) -> std::io::Result<()> {
        match &self.imp {
            CanAdapterImpl::TcpCanAdapter(adapter) => adapter.send(frame).await,
            #[cfg(feature = "socket-can")]
            CanAdapterImpl::SocketCanAdapter(adapter) => adapter.send(frame).await,
        }
    }

    pub fn bus(&self) -> &BusRef {
        &self.bus
    }
}
