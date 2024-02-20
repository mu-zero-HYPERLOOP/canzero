use std::sync::Arc;

use self::client::{TcpClient, TcpFrame};

use super::{can_frame::CanFrame, CanAdapterInterface, TCanError, TCanFrame};

pub mod client;

pub struct TcpCanAdapter {
    tcp_client: Arc<TcpClient>,
    bus_id: u32,
    rx: tokio::sync::Mutex<tokio::sync::mpsc::Receiver<TCanFrame>>,
    rx_err: tokio::sync::Mutex<tokio::sync::mpsc::Receiver<TCanError>>,
}

impl TcpCanAdapter {
    pub fn create(
        tcp_client: Arc<TcpClient>,
        bus_id: u32,
        rx: tokio::sync::mpsc::Receiver<TCanFrame>,
        rx_err: tokio::sync::mpsc::Receiver<TCanError>,
    ) -> Self {
        Self {
            tcp_client,
            bus_id,
            rx: tokio::sync::Mutex::new(rx),
            rx_err: tokio::sync::Mutex::new(rx_err),
        }
    }
}

impl CanAdapterInterface for TcpCanAdapter {
    async fn receive(&self) -> Result<TCanFrame, TCanError> {
        Ok(self
            .rx
            .lock()
            .await
            .recv()
            .await
            .expect("TcpCanAdapter rx channel closed early"))
    }

    async fn receive_err(&self) -> TCanError {
        self.rx_err
            .lock()
            .await
            .recv()
            .await
            .expect("TcpCanAdapter rx channel closed early")
    }

    async fn send(&self, frame: CanFrame) {
        self.tcp_client
            .send(TcpFrame {
                can_frame: frame,
                bus_id: self.bus_id,
            })
            .await;
    }
}

