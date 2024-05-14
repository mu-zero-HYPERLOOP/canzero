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
pub enum ConnectionHandshakeFrame {
    ConnectionIdRequest { request: u8, _padding: u8 },
    ConnectionId { success: u8, node_id: u8 },
}

#[derive(Serialize, Deserialize, Clone)]
pub enum TcpFrame {
    NetworkFrame(TNetworkFrame),
    KeepAlive { _padding: [u8; 29] },
}

#[derive(Debug)]
pub struct ConnectionIdHost {
    free_list: std::sync::Mutex<Vec<u8>>,
}

impl ConnectionIdHost {
    pub fn new(max_id: u8) -> Self {
        let mut free_list = vec![];
        for id in 0..=max_id {
            free_list.push(id);
        }
        free_list.reverse();
        Self {
            free_list: std::sync::Mutex::new(free_list),
        }
    }

    pub fn alloc_id(&self) -> Option<u8> {
        self.free_list
            .lock()
            .expect("Failed to acquire ConnectionIdHost lock")
            .pop()
    }

    pub fn alloc_specific_id(&self, id: u8) -> Option<u8> {
        let mut lck = self
            .free_list
            .lock()
            .expect("Failed to acquire ConnectionIdHost lock");
        let pos = lck.iter().position(|i| i == &id);
        match pos {
            Some(pos) => {
                lck.remove(pos);
                Some(id)
            }
            None => None,
        }
    }

    pub fn free_id(&self, id: u8) {
        let mut lck = self
            .free_list
            .lock()
            .expect("Failed to acquire ConnectionIdHost lock");
        if !lck.iter().any(|i| i == &id) {
            lck.push(id);
        }
    }
}

#[derive(Debug)]
pub enum ConnectionId {
    Request,
    None,
    Host(Arc<ConnectionIdHost>),
}

#[derive(Debug)]
pub struct TcpCan {
    tx_stream: Arc<Mutex<OwnedWriteHalf>>,
    rx_stream: Mutex<(Vec<u8>, OwnedReadHalf)>,
    wdg: Watchdog,
    node_id: Option<u8>,
    id_host: Option<Arc<ConnectionIdHost>>,
}

impl TcpCan {
    pub async fn connect(
        socketaddr: SocketAddr,
        connection_id: ConnectionId,
    ) -> std::io::Result<Self> {
        let tcp_stream = tokio::net::TcpStream::connect(socketaddr).await?;
        Ok(Self::new(tcp_stream, connection_id).await)
    }

    pub async fn new(tcp_stream: TcpStream, connection_id: ConnectionId) -> Self {
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

        let handshake_size = bincode::serialized_size(&ConnectionHandshakeFrame::ConnectionId {
            success: 0,
            node_id: 0,
        })
        .unwrap();

        let (mut rx, mut tx) = tcp_stream.into_split();

        let node_id: Option<u8> = match &connection_id {
            ConnectionId::Request => {
                let request = bincode::serialize(&ConnectionHandshakeFrame::ConnectionIdRequest {
                    request: 1,
                    _padding: 0,
                })
                .unwrap();
                tx.write_all(&request).await.unwrap();

                let mut rx_buffer = vec![0; handshake_size as usize];
                match rx.read_exact(&mut rx_buffer).await {
                    Ok(_) => match bincode::deserialize::<ConnectionHandshakeFrame>(&rx_buffer) {
                        Ok(tcp_frame) => match tcp_frame {
                            ConnectionHandshakeFrame::ConnectionId { success, node_id } => {
                                if success == 1 {
                                    Some(node_id)
                                } else {
                                    panic!("Connection ID request failed")
                                }
                            }
                            ConnectionHandshakeFrame::ConnectionIdRequest {
                                request: _,
                                _padding,
                            } => {
                                panic!("Illegal request: This tcpcan doesn't act as a id server")
                            }
                        },
                        Err(_) => panic!("Received ill formed TCP frame"),
                    },
                    Err(_) => panic!("Failed read to ConnectionHandshake TCP frame from socket"),
                }
            }
            ConnectionId::None => {
                // explicitly tell the host that no connection id is required!
                let request = bincode::serialize(&ConnectionHandshakeFrame::ConnectionIdRequest {
                    request: 0,
                    _padding: 0,
                })
                .unwrap();
                tx.write_all(&request).await.unwrap();
                None
            }
            ConnectionId::Host(host) => {
                let mut rx_buffer = vec![0; handshake_size as usize];
                match rx.read_exact(&mut rx_buffer).await {
                    Ok(_) => match bincode::deserialize::<ConnectionHandshakeFrame>(&rx_buffer) {
                        Ok(tcp_frame) => match tcp_frame {
                            ConnectionHandshakeFrame::ConnectionId {
                                success: _,
                                node_id: _,
                            } => {
                                panic!("Unexpected response: Host received connection id response during handshake");
                            }
                            ConnectionHandshakeFrame::ConnectionIdRequest { request, _padding } => {
                                if request == 1 {
                                    match host.alloc_id() {
                                        Some(node_id) => {
                                            let response = bincode::serialize(
                                                &ConnectionHandshakeFrame::ConnectionId {
                                                    success: 1,
                                                    node_id,
                                                },
                                            )
                                            .unwrap();
                                            tx.write_all(&response).await.unwrap();
                                            Some(node_id)
                                        }
                                        None => {
                                            let response = bincode::serialize(
                                                &ConnectionHandshakeFrame::ConnectionId {
                                                    success: 0,
                                                    node_id: 0,
                                                },
                                            )
                                            .unwrap();
                                            tx.write_all(&response).await.unwrap();
                                            None
                                        }
                                    }
                                } else {
                                    None
                                }
                            }
                        },
                        Err(_) => panic!("Received ill formed TCP frame"),
                    },
                    Err(_) => panic!("Failed to receive ConnectionHandshake TCP frame from socket"),
                }
            }
        };

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

        let wdg = Watchdog::create(Duration::from_millis(3000));

        Self {
            tx_stream: tx,
            rx_stream: Mutex::new((vec![0; network_frame_size as usize], rx)),
            wdg,
            node_id,
            id_host: match connection_id {
                ConnectionId::None | ConnectionId::Request => None,
                ConnectionId::Host(host) => Some(host),
            },
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
                            },
                        },
                        Err(_) => {
                            cprintln!("<red>TCP connection closed</red>");
                            if let Some(host) = &self.id_host{
                                if let Some(node_id) = &self.node_id {
                                    host.free_id(*node_id);
                                }
                            }
                            return None;
                        }
                    }
                },
                _wdg_timeout = self.wdg.timeout() =>  {
                    cprintln!("<red>TCP connection watchdog timed out</red>");
                    if let Some(host) = &self.id_host{
                        if let Some(node_id) = &self.node_id {
                            host.free_id(*node_id);
                        }
                    }
                    return None;
                },
            }
        }
    }
    pub async fn addr(&self) -> std::io::Result<SocketAddr> {
        self.tx_stream.lock().await.peer_addr()
    }

    pub fn connection_id(&self) -> Option<u8> {
        return self.node_id;
    }
}
