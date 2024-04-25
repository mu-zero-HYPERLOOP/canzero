use std::{net::SocketAddr, time::Duration};

use can_appdata::AppData;
use serde::Serialize;
use tauri::Manager;

use crate::state::startup::{NetworkConnectionCreateInfo, StartupState};

#[tauri::command]
pub async fn download_network_configuration(
    state: tauri::State<'_, StartupState>,
) -> Result<(), String> {
    let network_config = tokio::task::spawn_blocking(|| {
        let Ok(appdata) = AppData::read() else {
            return Err(
                "No config set use \n$ canzero config set-path <path-to-config>".to_owned(),
            );
        };
        let Some(config_path) = appdata.get_config_path() else {
            return Err(
                "No config set use \n$ canzero config set-path <path-to-config>".to_owned(),
            );
        };
        let Ok(network_config) = can_yaml_config_rs::parse_yaml_config_from_file(
            config_path
                .to_str()
                .expect("FUCK YOU for using non utf8 filenames"),
        ) else {
            return Err(format!("Failed to parse configuration at {config_path:?}"));
        };
        Ok(network_config)
    })
    .await
    .expect("Failed to join blocking task (during download_network_configuration)")?;
    state.set_network_config(network_config).await;
    Ok(())
}

const UDP_DISCOVERY_SERVICE_NAME: &'static str = "CANzero";

#[allow(unused)]
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

    let connections = match socket
        .send_to(&hello_msg, format!("255.255.255.255:9002"))
        .await
    {
        Ok(bytes_send) => {
            if bytes_send != hello_msg.len() {
                return Err(
                    "Failed to send complete hello packet on UDP discovery socket".to_owned(),
                );
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
                        let server_service_name =
                            std::str::from_utf8(&rx_buffer[3..packet_size]).unwrap();
                        if ty == 1u8 && server_service_name == UDP_DISCOVERY_SERVICE_NAME {
                            connections.push((server_addr.ip(), server_port));
                        }
                        continue;
                    }
                    Err(_) => {
                        break;
                    }
                    _ => continue,
                }
            }
            connections
        }
        Err(_) => vec![],
    };

    let connections: Vec<NetworkConnectionCreateInfo> = connections
        .into_iter()
        .map(|(ip_addr, port)| {
            return NetworkConnectionCreateInfo::Tcp(SocketAddr::new(ip_addr, port));
        })
        .collect();

    #[cfg(feature = "socket-can")]
    let Some(network_configuration): Option<can_config_rs::config::NetworkRef> = state.network_configuration().await
    else {
        return Err("Failed to discover networks. No network configuration avaiable.".to_owned());
    };
    #[cfg(feature = "socket-can")]
    let connections = {
        let mut connections = connections.clone();
        check_for_socketcan(&network_configuration, &mut connections);
        connections
    };

    state.set_connections(connections.clone()).await;
    Ok(connections
        .iter()
        .map(|con| match con {
            NetworkConnectionCreateInfo::Tcp(addr) => ConnectionDescription {
                tag: ConnectionType::Tcp,
                description: format!("{addr:?}"),
            },
            #[cfg(feature = "socket-can")]
            NetworkConnectionCreateInfo::SocketCan => ConnectionDescription {
                tag: ConnectionType::SocketCan,
                description: format!(
                    "SocketCAN at {:?}",
                    network_configuration
                        .buses()
                        .iter()
                        .map(|bus| bus.name())
                        .collect::<Vec<&str>>()
                ),
            },
        })
        .collect())
}

#[cfg(feature = "socket-can")]
pub fn check_for_socketcan(
    network_ref: &can_config_rs::config::NetworkRef,
    connections: &mut Vec<NetworkConnectionCreateInfo>,
) {
    for bus in network_ref.buses() {
        let Ok(_) = nix::net::if_::if_nametoindex(bus.name()) else {
            return;
        };
    }
    connections.push(NetworkConnectionCreateInfo::SocketCan);
}

#[tauri::command]
pub async fn try_connect(
    state: tauri::State<'_, StartupState>,
    app_handle: tauri::AppHandle,
    connection_index: usize,
) -> Result<(), String> {
    state.try_connect(connection_index, &app_handle).await
}

#[tauri::command]
pub async fn complete_setup(
    app_handle: tauri::AppHandle,
    startup_state: tauri::State<'_, StartupState>,
) -> Result<(), String> {
    // create cnl state
    let cnl_state = startup_state.complete_setup(&app_handle).await?;
    app_handle.manage(cnl_state);

    // create new window
    tauri::WindowBuilder::new(
        &app_handle,
        "main",
        tauri::WindowUrl::App("index.html".into()),
    )
    .title("CANzero control-panel")
    .inner_size(800f64, 600f64)
    .resizable(true)
    .visible(true)
    .build()
    .map_err(|err| format!("{err:?}"))?;

    return Ok(());
}

#[tauri::command]
pub fn close_startup(app_handle: tauri::AppHandle) {
    let Some(startup_window) = app_handle.get_window("startup") else {
        return;
    };
    startup_window
        .close()
        .expect("Failed to close startup window");
}
