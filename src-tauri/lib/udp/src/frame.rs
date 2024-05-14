use std::{
    net::IpAddr, time::{Duration, Instant}
};

#[derive(Clone, Debug)]
pub enum UdpFrame {
    Hello(HelloFrame),
    NDF(NetworkDescriptionFrame),
}

#[derive(Clone, Debug)]
pub struct HelloFrame {
    pub service_name: String,
}

#[derive(Clone, Debug)]
pub struct NetworkDescriptionFrame {
    pub service_name: String,
    pub service_port: u16,
    pub config_hash: u64,
    pub build_time: String,
    pub time_since_sor: Duration,
    pub server_name: String,
}

#[derive(Clone, Debug)]
pub struct NetworkDescription {
    pub timebase: Instant,
    pub config_hash: u64,
    pub build_time: String,
    pub server_name: String,
    pub service_port: u16,
    pub server_addr: IpAddr,
}

impl UdpFrame {
    pub fn into_bin(&self, buf8: &mut [u8; 216]) {
        match &self {
            UdpFrame::Hello(hello) => {
                buf8[0] = 0x0;
                let service_name_bytes = hello.service_name.as_bytes();
                for b in 0..service_name_bytes.len() {
                    buf8[27 + b] = service_name_bytes[b];
                }
            }
            UdpFrame::NDF(ndf) => {
                buf8[0] = 0x1;

                let service_name_bytes = ndf.service_name.as_bytes();
                assert!(service_name_bytes.len() < 64);
                for b in 0..service_name_bytes.len() {
                    buf8[24 + b] = service_name_bytes[b];
                }

                let build_time_bytes = ndf.build_time.as_bytes();
                assert!(build_time_bytes.len() < 64);
                for b in 0..build_time_bytes.len() {
                    buf8[88 + b] = build_time_bytes[b];
                }

                let server_name_bytes = ndf.server_name.as_bytes();
                assert!(service_name_bytes.len() < 64);
                for b in 0..server_name_bytes.len() {
                    buf8[152 + b] = server_name_bytes[b];
                }

                let buf16: &mut [u16; 108] = unsafe { std::mem::transmute(buf8) };
                buf16[1] = ndf.service_port;
                let buf64: &mut [u64; 27] = unsafe { std::mem::transmute(buf16) };
                buf64[1] = ndf.config_hash;
                buf64[2] = ndf.time_since_sor.as_micros() as u64;
            }
        }
    }

    pub fn from_bin(buf8: &[u8; 216]) -> Result<Self, ()> {
        let tag = buf8[0];
        if tag == 0x0 {
            let service_name = String::from_utf8_lossy(&buf8[27..27 + 64]).to_string();
            Ok(Self::Hello(HelloFrame { service_name }))
        } else if tag == 0x1 {
            let service_name = String::from_utf8_lossy(&buf8[27..27 + 64]).to_string();
            let build_time = String::from_utf8_lossy(&buf8[88..88 + 64]).to_string();
            let server_name = String::from_utf8_lossy(&buf8[152..88 + 64]).to_string();
            let buf16: &[u16; 108] = unsafe { std::mem::transmute(buf8) };
            let service_port = buf16[1];
            let buf64: &[u64; 27] = unsafe { std::mem::transmute(buf16) };
            let config_hash = buf64[1];
            let time_since_sor = Duration::from_micros(buf64[2]);
            Ok(Self::NDF(NetworkDescriptionFrame {
                service_name,
                service_port,
                config_hash,
                build_time,
                time_since_sor,
                server_name,
            }))
        } else {
            Err(())
        }
    }
}
