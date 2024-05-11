use std::{net::IpAddr, time::{Duration, Instant}};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum UdpFrame {
    Hello(HelloFrame),
    NDF(NetworkDescriptionFrame)
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct HelloFrame {
    pub service_name : String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NetworkDescriptionFrame {
    pub service_name : String,
    pub service_port : u16,
    pub config_hash : u64,
    pub build_time : String,
    pub time_since_sor : Duration,
    pub server_name: String,
}

#[derive(Clone, Debug)]
pub struct NetworkDescription {
    pub timebase : Instant,
    pub config_hash : u64,
    pub build_time : String,
    pub server_name: String,
    pub service_port : u16,
    pub server_addr : IpAddr,
}
