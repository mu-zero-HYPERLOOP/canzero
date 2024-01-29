use std::sync::Arc;

use can_config_rs::config;

use crate::cnl::can_frame::CanFrame;

use super::CAN;

pub struct TxCom {
    // needed to find right bus for messages
    network_ref: config::NetworkRef,
    getter_can_adapter: Arc<CAN>,
}

impl TxCom {
    pub fn create(network_ref: config::NetworkRef, getter_can_adapter: &Arc<CAN>) -> TxCom {
        TxCom {
            network_ref,
            getter_can_adapter: getter_can_adapter.clone(),
        }
    }

    pub fn send_set_request(&self, server_id: u16, oe_id: u32, val: Vec<u32>, last_fill: u8) {
        println!("attempted send of {val:?}");

        let client_id: u64 = 0x0; // need my own node id! how?
        let (set_request_id, ide) = match self.network_ref.set_req_message().id() {
            config::MessageId::StandardId(id) => (*id, false),
            config::MessageId::ExtendedId(id) => (*id, true),
        };
        let mut frame_data: Vec<CanFrame> = vec![];
        let frames_to_send = val.len();

        for i in 0..frames_to_send {
            // SOF
            let mut data_curr = if i == 0 { 1u64 << 63 } else { 0u64 };
            // EOF
            data_curr |= if i == frames_to_send - 1 { 1u64 << 62 } else { 0u64 };
            // toggle
            data_curr |= ((i % 2) as u64) << 61;
            // oe-id
            data_curr |= (oe_id as u64) << 48;
            // client-id
            data_curr |= client_id << 40;
            // server-id
            data_curr |= (server_id as u64) << 32;
            // data
            data_curr |= val[i] as u64;

            let dlc = if i == frames_to_send - 1 { 4 + last_fill } else { 8 };
            frame_data.push(CanFrame::new(set_request_id, ide, false, dlc, data_curr));
        }

        let can_adapter = self.ne
        fragmented_can_send(frame_data, );


    }
}

async fn fragmented_can_send(
    frames: Vec<CanFrame>,
    can_adapter: &Arc<CAN>,
) {
}
