use std::time::Duration;

use canzero_common::{CanFrame, NetworkFrame, TNetworkFrame};


#[derive(Clone)]
pub enum ConnectionHandshakeFrame {
    ConnectionIdRequest { request: bool },
    ConnectionId { success: bool, node_id: u8 },
}

impl ConnectionHandshakeFrame {

    pub fn bin_size() -> usize {
        return 2;
    }

    pub fn into_bin(&self, buf : &mut [u8;2]) {
        match &self {
            ConnectionHandshakeFrame::ConnectionIdRequest { request } => {
                if *request {
                    buf[0] = 0x80;
                }else {
                    buf[0] = 0;
                }
            }
            ConnectionHandshakeFrame::ConnectionId { success, node_id } => {
                if *success {
                    buf[0] = 0x81;
                }else {
                    buf[0] = 0x00;
                }
                buf[1] = *node_id;
            }
        }
    }

    pub fn from_bin(buf : &[u8;2]) -> Result<Self,()> {
        let tag = buf[0] & 0x7F;
        if tag == 0 {
            let request = buf[0] & 0x80 != 0;
            Ok(Self::ConnectionIdRequest { request})
        }else if tag == 1 {
            let success = buf[0] & 0x80 != 0;
            let node_id = buf[1];
            Ok(Self::ConnectionId { success, node_id })
        }else {
            Err(())
        }
    }
}


#[derive(Clone)]
pub enum TcpFrame {
    NetworkFrame(TNetworkFrame),
    KeepAlive,
}

impl TcpFrame {

    pub fn bin_size() -> usize {
        return 24;
    }

    pub fn into_bin(&self, buf : &mut [u8;24]) {
        match &self {
            TcpFrame::NetworkFrame(timestamped) => {
                let frame = &timestamped.value;
                let timestamp = timestamped.timestamp.as_micros() as u64;
                let bus_id = &frame.bus_id;
                let can_id = frame.can_frame.key();
                let data = frame.can_frame.get_data_u64();
                let dlc = frame.can_frame.get_dlc();
                
                buf[0] = 0x1;
                buf[1] = *bus_id as u8;
                buf[2] = dlc;
                let buf : &mut [u32;6] = unsafe {std::mem::transmute(buf)};
                buf[1] = can_id;
                let buf : &mut [u64;3] = unsafe {std::mem::transmute(buf)};
                buf[1] = timestamp;
                buf[2] = data;


            }
            TcpFrame::KeepAlive => {
                buf[0] = 0x0;
            }
        }
    }

    pub fn from_bin(buf : &[u8;24]) -> Result<Self, ()> {
        let tag = buf[0];
        if tag == 0x0 {
            Ok(TcpFrame::KeepAlive)
        }else if tag == 0x1 {
            let bus_id = buf[1] as u32;
            let dlc = buf[2];
            let buf : &[u32;6] = unsafe {std::mem::transmute(buf)};
            let can_id = buf[1];
            let buf : &[u64;3] = unsafe {std::mem::transmute(buf)};
            let timestamp = Duration::from_micros(buf[1]);
            let data = buf[2];

            Ok(TcpFrame::NetworkFrame(TNetworkFrame::new(timestamp, NetworkFrame { bus_id, can_frame: CanFrame::new_raw(can_id, dlc, data) })))
        }else {
            Err(())
        }
    }
}
