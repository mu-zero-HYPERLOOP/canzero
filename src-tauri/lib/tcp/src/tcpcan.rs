use std::{net::SocketAddr, ops::DerefMut, sync::Arc, time::Duration};

use color_print::cprintln;
use serde::{Deserialize, Serialize};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{
        tcp::{OwnedReadHalf, OwnedWriteHalf},
        TcpStream,
    },
    sync::Mutex,
};

use canzero_common::{CanFrame, NetworkFrame, TNetworkFrame};

use crate::wdg::Watchdog;

#[derive(Serialize, Deserialize, Clone)]
pub enum TcpFrame {
    NetworkFrame(TNetworkFrame),
    KeepAlive { _padding: [u8; 29] },
}

#[derive(Debug)]
pub struct TcpCan {
    tx_stream: Arc<Mutex<OwnedWriteHalf>>,
    rx_stream: Mutex<(Vec<u8>, OwnedReadHalf)>,
    wdg: Watchdog,
}

impl TcpCan {
    pub async fn connect(socketaddr: SocketAddr) -> std::io::Result<Self> {
        let tcp_stream = tokio::net::TcpStream::connect(socketaddr).await?;
        Ok(Self::new(tcp_stream))
    }

    pub fn new(tcp_stream: TcpStream) -> Self {
        let network_frame_size =
            bincode::serialized_size(&TcpFrame::NetworkFrame(TNetworkFrame::new(
                Duration::from_secs(0),
                NetworkFrame {
                    bus_id: 0,
                    can_frame: CanFrame::new(0, false, false, 0, 0),
                },
            )))
            .unwrap();

        let keep_alive_frame_size =
            bincode::serialized_size(&TcpFrame::KeepAlive { _padding: [0; 29] }).unwrap();
        assert_eq!(keep_alive_frame_size, network_frame_size);

        let (rx, tx) = tcp_stream.into_split();

        let tx = Arc::new(Mutex::new(tx));

        let keep_alive_sock = tx.clone();
        tokio::spawn(async move {
            let keep_alive_frame =
                bincode::serialize(&TcpFrame::KeepAlive { _padding: [0; 29] }).unwrap();
            loop {
                tokio::time::interval(Duration::from_millis(500))
                    .tick()
                    .await;
                if let Err(_) = keep_alive_sock
                    .lock()
                    .await
                    .write_all(&keep_alive_frame)
                    .await
                {
                    break; // Failed to send once -> stop sending keep alive completel! will
                           // eventually lead to none beeing returned from the recv() function!
                };
                // failed to send keep alive!
            }
        });

        let wdg = Watchdog::create(Duration::from_millis(1000));

        Self {
            tx_stream: tx,
            rx_stream: Mutex::new((vec![0; network_frame_size as usize], rx)),
            wdg,
        }
    }

    pub async fn send(&self, frame: &TNetworkFrame) -> std::io::Result<()> {
        let bytes = bincode::serialize(&TcpFrame::NetworkFrame(frame.clone())).unwrap();
        self.tx_stream.lock().await.write_all(&bytes).await
    }

    pub async fn recv(&self) -> Option<TNetworkFrame> {
        let mut rx_lock = self.rx_stream.lock().await;
        let (rx_buffer, rx_stream) = rx_lock.deref_mut();
        loop {
            tokio::select! {
                rx_res = rx_stream.read_exact(rx_buffer) => {
                    match rx_res {
                        Ok(_) => match bincode::deserialize::<TcpFrame>(rx_buffer).unwrap() {
                            TcpFrame::NetworkFrame(network_frame) => return Some(network_frame),
                            TcpFrame::KeepAlive { _padding } => {
                                self.wdg.reset().await;
                            }
                        },
                        Err(_) => {
                            cprintln!("<red>TCP connection closed</red>");
                            return None;
                        }
                    }
                },
                _wdg_timeout = self.wdg.timeout() =>  {
                    cprintln!("<red>TCP connection watchdog timed out</red>");
                    return None;
                },
            }
        }
    }
    pub async fn addr(&self) -> std::io::Result<SocketAddr> {
        self.tx_stream.lock().await.peer_addr()
    }
}
