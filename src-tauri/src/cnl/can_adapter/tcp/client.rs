use std::mem::size_of;

use tokio::io::{AsyncReadExt, AsyncWriteExt};

use crate::cnl::can_adapter::{
    can_frame::CanFrame, timestamped::Timestamped, TCanError, TCanFrame,
};

pub struct TcpFrame {
    pub can_frame: CanFrame,
    pub bus_id: u32,
}

pub struct TcpClient {
    write_stream: tokio::sync::Mutex<tokio::net::tcp::OwnedWriteHalf>,
}

impl TcpClient {
    pub async fn create(
        address: &str,
        can_rx_adapters: Vec<(
            tokio::sync::mpsc::Sender<TCanFrame>,
            tokio::sync::mpsc::Sender<TCanError>,
        )>,
    ) -> Self {
        let stream = tokio::net::TcpStream::connect(address)
            .await
            .expect(&format!("Failed to connect to tcp server at : {address}"));
        println!("Connected to TCP-Server at {address}");
        let (mut read_stream, write_stream) = stream.into_split();
        tokio::spawn(async move {
            loop {
                let mut buffer: [u8; size_of::<TcpFrame>()] = [0; size_of::<TcpFrame>()];
                read_stream
                    .read_exact(&mut buffer)
                    .await
                    .expect("TCP Connection closed");
                let frame: TcpFrame = unsafe { std::ptr::read(buffer.as_ptr() as *const _) };
                let bus_id = frame.bus_id;
                can_rx_adapters
                    .get(bus_id as usize)
                    .unwrap()
                    .0
                    .send(Timestamped::now(frame.can_frame))
                    .await
                    .expect("TcpClient -> CanAdapter rx channel closed early");
            }
        });
        Self {
            write_stream: tokio::sync::Mutex::new(write_stream),
        }
    }

    pub async fn send(&self, frame: TcpFrame) {
        let byte_slice: &[u8] = unsafe {
            ::core::slice::from_raw_parts(
                (&frame as *const TcpFrame) as *const u8,
                size_of::<TcpFrame>(),
            )
        };
        self.write_stream
            .lock()
            .await
            .write_all(byte_slice)
            .await
            .expect("Failed to write to TcpStream: TcpConnection closed early");
    }
}
