use std::{mem::size_of, net::SocketAddr, time::Duration};

use tokio::io::{AsyncReadExt, AsyncWriteExt};

use crate::{
    cnl::can_adapter::{can_frame::CanFrame, timestamped::Timestamped, TCanError, TCanFrame},
    notification::{notify_error, notify_warning},
};

pub struct TcpFrame {
    pub bus_id: u32,
    pub can_frame: CanFrame,
}

pub struct TTcpFrame {
    pub tcp_frame: TcpFrame,
    pub timestamp_us: u128,
}

pub struct TcpClient {
    write_stream: tokio::sync::Mutex<tokio::net::tcp::OwnedWriteHalf>,
}

impl TcpClient {
    pub async fn create(
        address: &SocketAddr,
        app_handle: &tauri::AppHandle,
        can_rx_adapters: Vec<tokio::sync::mpsc::Sender<Result<TCanFrame, TCanError>>>,
    ) -> std::io::Result<Self> {
        let app_handle = app_handle.clone();
        let stream = tokio::net::TcpStream::connect(address).await?;
        println!("Connected to TCP-Server at {address}");
        let (mut read_stream, write_stream) = stream.into_split();
        tokio::spawn(async move {
            loop {
                let mut buffer: [u8; size_of::<TTcpFrame>()] = [0; size_of::<TTcpFrame>()];
                let Ok(_) = read_stream.read_exact(&mut buffer).await else {
                    notify_error(
                        &app_handle,
                        "TCP Connection closed",
                        "The connection to the server closed early",
                        chrono::offset::Local::now(),
                    );
                    break;
                };
                let frame: TTcpFrame = unsafe { std::ptr::read(buffer.as_ptr() as *const _) };
                let tcp_frame = frame.tcp_frame;
                let timestamp = frame.timestamp_us;
                let bus_id = tcp_frame.bus_id;
                let can_frame = tcp_frame.can_frame;
                let Ok(_) = can_rx_adapters
                    .get(bus_id as usize)
                    .unwrap()
                    .send(Ok(Timestamped::new(
                        //TODO we should also be able to receive can errors
                        // over TCP!
                        Duration::from_micros(timestamp as u64),
                        can_frame,
                    )))
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
        Ok(Self {
            write_stream: tokio::sync::Mutex::new(write_stream),
        })
    }

    pub async fn send(&self, frame: TcpFrame) -> std::io::Result<()> {
        let byte_slice: &[u8] = unsafe {
            ::core::slice::from_raw_parts(
                (&frame as *const TcpFrame) as *const u8,
                size_of::<TcpFrame>(),
            )
        };
        Ok(self.write_stream.lock().await.write_all(byte_slice).await?)
    }
}
