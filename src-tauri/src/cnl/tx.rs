use std::{sync::Arc, time::Duration};

use can_config_rs::config;

use crate::cnl::can_frame::CanFrame;

use super::CanAdapter;

pub struct TxCom {
    network_ref: config::NetworkRef,
    set_req_can_adapter: Arc<CanAdapter>,
    my_node_id: u8,
    frag_time_ms: u64,
}

impl TxCom {
    pub fn create(network_ref: &config::NetworkRef, can_adapters: &Vec<Arc<CanAdapter>>) -> TxCom {
        println!("hey3");
        let set_req_bus_id = network_ref.set_req_message().bus().id();
        println!("hey3");
        let can_dap_opt = can_adapters.iter().find(|adapter| adapter.id() == set_req_bus_id);
        println!("{}", can_dap_opt.is_some());
        let can_adap = match can_adapters.iter().find(|adapter| adapter.id() == set_req_bus_id) {
                Some(adapter) => adapter.clone(),
                None => {
                    println!("I fucked up");
                    panic!("can adapter for set requests missing!");
                }
        };
        println!("hey4");

        TxCom {
            network_ref: network_ref.clone(),
            my_node_id: network_ref.nodes().len() as u8,
            set_req_can_adapter: can_adap,
            frag_time_ms: 50, 
        }
    }

    pub fn send_set_request(&self, server_id: u16, oe_id: u32, val: Vec<u32>, last_fill: u8) {
        println!("attempted send of {val:?}");

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
            data_curr |= (self.my_node_id as u64) << 40;
            // server-id
            data_curr |= (server_id as u64) << 32;
            // data
            data_curr |= val[i] as u64;

            let dlc = if i == frames_to_send - 1 { 4 + last_fill } else { 8 };
            frame_data.push(CanFrame::new(set_request_id, ide, false, dlc, data_curr));
        }

        fragmented_can_send(frame_data, self.set_req_can_adapter.clone(), self.frag_time_ms);
    }
}

fn fragmented_can_send(
    frames: Vec<CanFrame>,
    can_adapter: Arc<CanAdapter>,
    frag_time_ms: u64,
) {
    tokio::spawn(async move {
        for frame in frames {
            can_adapter.send(frame).await;
            tokio::time::sleep(Duration::from_millis(frag_time_ms)).await;
        }
    });
}
