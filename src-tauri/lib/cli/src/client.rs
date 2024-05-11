use std::{net::SocketAddr, sync::Arc};

use canzero_udp::scanner::UdpNetworkScanner;

use crate::errors::Result;

pub async fn command_client() -> Result<()> {
    if cfg!(feature = "socket-can") {
        #[cfg(feature = "socket-can")]
        {
            let scanner = UdpNetworkScanner::create().await?;
            scanner.start();
            let connection = scanner.next().await?;
            drop(scanner);

            let socketcan = Arc::new(canzero_socketcan::socket_can::SocketCan::connect().await?);

            let tcpcan = Arc::new(
                canzero_tcp::tcpcan::TcpCan::connect(SocketAddr::new(
                    connection.server_addr,
                    connection.service_port,
                ))
                .await?,
            );

            let socketcan_rx = socketcan.clone();
            let tcpcan_tx = tcpcan.clone();
            tokio::spawn(async move {
                loop {
                    let frame = socketcan_rx.recv().await.unwrap();
                    tcpcan_tx.send(&frame).await.unwrap();
                }
            });

            loop {
                let frame = tcpcan.recv().await.unwrap();
                socketcan.send(&frame).await.unwrap();
            }
        }
    } else {
        eprintln!("client command not avaiable. client only avaiable if compiled with the socket-can feature");
    }

    Ok(())
}
