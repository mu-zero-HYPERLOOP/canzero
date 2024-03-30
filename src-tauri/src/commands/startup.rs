use std::{net::SocketAddr, time::Duration};

use serde::Serialize;

use crate::state::startup::{NetworkConnectionCreateInfo, StartupState};

#[tauri::command]
pub async fn download_network_configuration(
    state: tauri::State<'_, StartupState>,
) -> Result<(), String> {
    let res = tokio::task::spawn_blocking(move || match can_live_config_rs::fetch_live_config() {
        Ok(network_config) => {
            let network_config = network_config.clone();
            Ok(network_config)
        }
        Err(live_config_error) => Err(format!("{live_config_error:?}")),
    })
    .await;
    match res {
        Ok(Ok(network)) => {
            state.set_network_config(network).await;
            Ok(())
        }
        Ok(Err(err)) => Err(err),
        Err(_) => Err("Failed to join blocking task".to_owned()),
    }
}

const UDP_DISCOVERY_SERVICE_NAME: &'static str = "CANzero";

pub enum ConnectionType {
    SocketCan = 0,
    Tcp = 1,
}

impl Serialize for ConnectionType {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_u8(match self {
            ConnectionType::SocketCan => 0,
            ConnectionType::Tcp => 1,
        })
    }
}

#[derive(Serialize)]
pub struct ConnectionDescription {
    tag: ConnectionType,
    description: String,
}

#[tauri::command]
pub async fn discover_servers(
    state: tauri::State<'_, StartupState>,
) -> Result<Vec<ConnectionDescription>, String> {
    let Ok(socket) = tokio::net::UdpSocket::bind(&format!("0.0.0.0:0")).await else {
        return Err("Failed to bind UDP discovery socket".to_owned());
    };

    let Ok(()) = socket.set_broadcast(true) else {
        return Err("Failed set SO_BROADCAST option for UDP discovery socket".to_owned());
    };

    let mut hello_msg = vec![0u8];
    hello_msg.extend_from_slice(UDP_DISCOVERY_SERVICE_NAME.as_bytes());
    // CANzero discovery broadcast are always broadcast on port 9002!
    let Ok(bytes_send) = socket
        .send_to(&hello_msg, format!("255.255.255.255:9002"))
        .await
    else {
        return Err("Failed to send hello packet on UDP discovery socket".to_owned());
    };
    if bytes_send != hello_msg.len() {
        return Err("Failed to send complete hello packet on UDP discovery socket".to_owned());
    }

    let mut rx_buffer = [0u8; 1024];
    let mut connections = vec![];
    loop {
        match tokio::time::timeout(
            Duration::from_millis(1000),
            socket.recv_from(&mut rx_buffer),
        )
        .await
        {
            Ok(Ok((packet_size, server_addr))) => {
                let ty = rx_buffer[0];
                let server_port = (rx_buffer[1] as u16) | ((rx_buffer[2] as u16) << 8);
                let server_service_name = std::str::from_utf8(&rx_buffer[3..packet_size]).unwrap();
                if ty == 1u8 && server_service_name == UDP_DISCOVERY_SERVICE_NAME {
                    connections.push((server_addr.ip(), server_port));
                }
                break;
            }
            Err(_) => {
                break;
            }
            _ => continue,
        }
    }

    let connections: Vec<NetworkConnectionCreateInfo> = connections
        .into_iter()
        .map(|(ip_addr, port)| {
            return NetworkConnectionCreateInfo::Tcp(SocketAddr::new(ip_addr, port));
        })
        .collect();
    // TODO add SOCKETCAN connection

    state.set_connections(connections.clone()).await;
    let mut con: Vec<ConnectionDescription> = connections
        .iter()
        .map(|con| match con {
            NetworkConnectionCreateInfo::Tcp(addr) => ConnectionDescription {
                tag: ConnectionType::Tcp,
                description: format!("{addr:?}"),
            },
            NetworkConnectionCreateInfo::SocketCan => ConnectionDescription {
                tag: ConnectionType::SocketCan,
                description: format!("SocketCAN at ???"),
            },
        })
        .collect();
    con.push(ConnectionDescription {
        tag: ConnectionType::SocketCan,
        description: format!("SOCKETCAN"),
    });
    Ok(con)
}

#[tauri::command]
pub async fn try_connect(
    state: tauri::State<'_, StartupState>,
    connection_index: usize,
) -> Result<(), String> {
    state.try_connect(connection_index).await
}

#[tauri::command]
pub async fn complete_setup(state: tauri::State<'_, StartupState>) -> Result<(), String> {
    todo!("complete setup is not yet implemented!");
}
