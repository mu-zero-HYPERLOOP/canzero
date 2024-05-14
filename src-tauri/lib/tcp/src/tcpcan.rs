use std::{net::SocketAddr, ops::DerefMut, sync::Arc, time::Duration};

use color_print::cprintln;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{
        tcp::{OwnedReadHalf, OwnedWriteHalf},
        TcpStream,
    }, sync::Mutex,
};

use canzero_common::TNetworkFrame;

use crate::{frame::{ConnectionHandshakeFrame, TcpFrame}, wdg::Watchdog};

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
    rx_stream: Mutex<OwnedReadHalf>,
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

        let (mut rx, mut tx) = tcp_stream.into_split();

        let node_id: Option<u8> = match &connection_id {
            ConnectionId::Request => {
                let mut request = [0;2];
                ConnectionHandshakeFrame::ConnectionIdRequest {
                    request: true,
                }.into_bin(&mut request);

                tx.write_all(&request).await.unwrap();

                let mut rx_buffer = [0; 2usize];
                match rx.read_exact(&mut rx_buffer).await {
                    Ok(_) => match ConnectionHandshakeFrame::from_bin(&rx_buffer) {
                        Ok(handshake_frame) => match handshake_frame {
                            ConnectionHandshakeFrame::ConnectionId { success, node_id } => {
                                if success {
                                    Some(node_id)
                                } else {
                                    panic!("Connection ID request failed")
                                }
                            }
                            ConnectionHandshakeFrame::ConnectionIdRequest {
                                request: _,
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
                let mut request = [0;2];
                ConnectionHandshakeFrame::ConnectionIdRequest {
                    request: false,
                }.into_bin(&mut request);
                tx.write_all(&request).await.unwrap();
                None
            }
            ConnectionId::Host(host) => {
                let mut rx_buffer = [0;2];
                match rx.read_exact(&mut rx_buffer).await {
                    Ok(_) => match ConnectionHandshakeFrame::from_bin(&rx_buffer) {
                        Ok(tcp_frame) => match tcp_frame {
                            ConnectionHandshakeFrame::ConnectionId {
                                success: _,
                                node_id: _,
                            } => {
                                panic!("Unexpected response: Host received connection id response during handshake");
                            }
                            ConnectionHandshakeFrame::ConnectionIdRequest { request } => {
                                if request {
                                    match host.alloc_id() {
                                        Some(node_id) => {
                                            let mut response = [0;2];
                                            ConnectionHandshakeFrame::ConnectionId {
                                                    success: true,
                                                    node_id,
                                            }.into_bin(&mut response);
                                            tx.write_all(&response).await.unwrap();
                                            Some(node_id)
                                        }
                                        None => {
                                            let mut response = [0;2];
                                            ConnectionHandshakeFrame::ConnectionId {
                                                success: true,
                                                node_id: 0,
                                            }.into_bin(&mut response);
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
            let mut keep_alive_frame = [0;24];
            TcpFrame::KeepAlive.into_bin(&mut keep_alive_frame);
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
            rx_stream: Mutex::new(rx),
            wdg,
            node_id,
            id_host: match connection_id {
                ConnectionId::None | ConnectionId::Request => None,
                ConnectionId::Host(host) => Some(host),
            },
        }
    }

    pub async fn send(&self, frame: &TNetworkFrame) -> std::io::Result<()> {
        let mut bytes = [0;24];
        TcpFrame::NetworkFrame(frame.clone()).into_bin(&mut bytes);
        self.tx_stream.lock().await.write_all(&bytes).await
    }

    pub async fn recv(&self) -> Option<TNetworkFrame> {
        let mut rx_lock = self.rx_stream.lock().await;
        let rx_stream = rx_lock.deref_mut();
        let mut rx_buffer = [0;24];
        loop {
            tokio::select! {
                rx_res = rx_stream.read_exact(&mut rx_buffer) => {
                    match rx_res {
                        Ok(_) => match TcpFrame::from_bin(&rx_buffer).unwrap() {
                            TcpFrame::NetworkFrame(network_frame) => return Some(network_frame),
                            TcpFrame::KeepAlive => {
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
