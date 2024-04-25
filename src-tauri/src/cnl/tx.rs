use std::{sync::Arc, time::Duration};

use can_config_rs::config;
use tokio::time;

use super::CanAdapter;

use canzero_common::CanFrame;

pub struct TxCom {
    network_ref: config::NetworkRef,
    set_req_can_adapter: Arc<CanAdapter>,
    get_req_can_adapter: Arc<CanAdapter>,
    my_node_id: u8,
    frag_time_ms: u64,
}

impl TxCom {
    pub fn create(network_ref: &config::NetworkRef, can_adapters: &Vec<Arc<CanAdapter>>) -> TxCom {
        let set_req_can_adapter = can_adapters
            .iter()
            .find(|adapter| adapter.bus().id() == network_ref.set_req_message().bus().id())
            .expect("DETECTED INVALID CONFIG: no set_req message in the config")
            .clone();

        let get_req_can_adapter = can_adapters
            .iter()
            .find(|adapter| adapter.bus().id() == network_ref.get_req_message().bus().id())
            .expect("DETECTED INVALID CONFIG: no get_req message in the config")
            .clone();

        TxCom {
            network_ref: network_ref.clone(),
            my_node_id: network_ref.nodes().len() as u8,
            set_req_can_adapter,
            get_req_can_adapter,
            frag_time_ms: 50,
        }
    }

    pub async fn send_set_request(&self, server_id: u8, oe_id: u32, val: Vec<u32>, last_fill: u8) {
        let (set_request_id, ide) = match self.network_ref.set_req_message().id() {
            config::MessageId::StandardId(id) => (*id, false),
            config::MessageId::ExtendedId(id) => (*id, true),
        };
        let mut frame_data: Vec<CanFrame> = vec![];
        let frames_to_send = val.len();

        for i in 0..frames_to_send {
            // SOF
            let mut data_curr = if i == 0 { 1u64 } else { 0u64 };
            // EOF
            data_curr |= if i == frames_to_send - 1 {
                1u64 << 1
            } else {
                0u64
            };
            // toggle
            data_curr |= ((i % 2) as u64) << 2;
            // oe-id
            data_curr |= (oe_id as u64) << 3;
            // client-id
            data_curr |= (self.my_node_id as u64) << 16;
            // server-id
            data_curr |= (server_id as u64) << 24;
            // data
            data_curr |= (val[i] as u64) << 32;

            let dlc = if i == (frames_to_send - 1) {
                4 + last_fill
            } else {
                8
            };
            frame_data.push(CanFrame::new(set_request_id, ide, false, dlc, data_curr));
        }
        println!(
            "sending set request {{ oe_id: {oe_id}, client: {}, server: {server_id}, data{:?} }}",
            self.my_node_id, &val
        );

        fragmented_can_send(
            frame_data,
            self.set_req_can_adapter.clone(),
            self.frag_time_ms,
        ).await;
    }

    pub async fn send_get_req(&self, server_id: u8, object_entry_id: u16) {
        let mut data : u64= 0;
        data |= object_entry_id as u64;
        data |= (self.network_ref.nodes().len() as u64) << 13;
        data |= (server_id as u64) << 21;

        if let Err(err) = self.get_req_can_adapter.send(CanFrame::new(
            self.network_ref.get_req_message().id().as_u32(),
            self.network_ref.get_req_message().id().ide(),
            false,
            self.network_ref.get_req_message().dlc(),
            data,
        )).await {
            eprintln!("{err:?}");
        };
    }
}

async fn fragmented_can_send(frames: Vec<CanFrame>, can_adapter: Arc<CanAdapter>, frag_time_ms: u64) {
    let mut interval = time::interval(Duration::from_millis(frag_time_ms));
    for frame in frames {
        // first tick completes instantaniously
        interval.tick().await;
        if let Err(err) = can_adapter.send(frame).await {
            eprintln!("{err:?}");
        }
    }
}
