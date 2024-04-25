use std::{net::SocketAddr, sync::Arc, time::{Duration, Instant}};

use crate::notification::notify_warning;

use can_tcp_bridge_rs::{
    frame::{NetworkFrame, TNetworkFrame},
    tcpcan::TcpCan,
};

use canzero_common::{CanFrame, TCanError, TCanFrame, Timestamped};

pub struct TcpClient {
    tcpcan: Arc<TcpCan>,
}

impl TcpClient {
    pub async fn create(
        address: &SocketAddr,
        app_handle: &tauri::AppHandle,
        can_rx_adapters: Vec<tokio::sync::mpsc::Sender<Result<TCanFrame, TCanError>>>,
    ) -> std::io::Result<Self> {
        let app_handle = app_handle.clone();
        let stream = tokio::net::TcpStream::connect(address).await?;

        let tcpcan = Arc::new(TcpCan::new(stream));
        let tcpcan_rx = tcpcan.clone();
        tokio::spawn(async move {
            loop {
                let Some(tnetwork_frame) = tcpcan_rx.recv().await else {
                    panic!("Tcp connection closed early");
                };

                let network_frame = tnetwork_frame.value;
                let timestamp = tnetwork_frame.timestamp;
                let bus_id = network_frame.bus_id;
                let can_frame = network_frame.can_frame;

                let Some(can_rx_adapter) = can_rx_adapters.get(bus_id as usize) else {
                    eprintln!("Received invalid NetworkFrame with invalid bus id (dropped frame)");
                    continue;
                };

                let Ok(_) = can_rx_adapter
                    .send(Ok(Timestamped::new(timestamp, can_frame)))
                    .await
                else {
                    notify_warning(
                        &app_handle,
                        "Failed to send frame",
                        "Error during sending on the TCP connection to the network",
                        chrono::offset::Local::now(),
                    );
                    continue;
                };
            }
        });
        Ok(Self { tcpcan })
    }

    pub async fn send(&self, frame: NetworkFrame) -> std::io::Result<()> {
        self.tcpcan.send(&TNetworkFrame::now(Instant::now(), frame)).await
    }
}
