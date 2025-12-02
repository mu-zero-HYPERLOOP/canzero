use std::time::Duration;

use canzero_udp::{frame::NetworkDescription, scanner::UdpNetworkScanner};

use crate::errors::{Error, Result};


pub async fn discover(port : Option<u16>) -> Result<NetworkDescription> {
    let scanner = UdpNetworkScanner::create(port.unwrap_or(9002)).await?;
    scanner.start();
    match scanner.next_timeout(Duration::from_millis(1000)).await {
        Some(Ok(con)) => Ok(con),
        _ => Err(Error::NoServerFound),
    }
}
