use std::sync::Arc;

use self::client::{TcpClient, TcpFrame};

use super::{
    can_error::TCanError,
    can_frame::{CanFrame, TCanFrame},
};

pub mod client;

pub struct TcpCanAdapter {
    tcp_client: Arc<TcpClient>,
    bus_id: u32,
    rx: tokio::sync::Mutex<tokio::sync::mpsc::Receiver<Result<TCanFrame, TCanError>>>,
}

impl TcpCanAdapter {
    pub fn create(
        tcp_client: Arc<TcpClient>,
        bus_id: u32,
        rx: tokio::sync::mpsc::Receiver<Result<TCanFrame, TCanError>>,
    ) -> Self {
        Self {
            tcp_client,
            bus_id,
            rx: tokio::sync::Mutex::new(rx),
        }
    }

    pub async fn receive(&self) -> std::io::Result<Result<TCanFrame, TCanError>> {
        let Some(frame) = self.rx.lock().await.recv().await else {
            return Err(std::io::Error::new(
                std::io::ErrorKind::ConnectionAborted,
                "TCP connection closed early".to_owned(),
            ));
        };
        Ok(frame)
    }

    pub async fn send(&self, frame: CanFrame) -> std::io::Result<()> {
        self.tcp_client
            .send(TcpFrame {
                can_frame: frame,
                bus_id: self.bus_id,
            })
            .await
    }
}
