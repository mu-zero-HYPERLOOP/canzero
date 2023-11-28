use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use can_config_rs::config;
use rand::{rngs::ThreadRng, Rng};

use super::can_frame::{CanError, CanFrame};

fn random_get_resp(rng: &mut ThreadRng, network_config: &config::NetworkRef) -> CanFrame {
    let object_entries: Vec<&Arc<config::ObjectEntry>> = network_config
        .nodes()
        .iter()
        .map(|node| node.object_entries().iter())
        .flatten()
        .collect();
    let object_entry = object_entries[rng.gen_range(0..object_entries.len())];

    let msg = network_config.get_resp_message();

    let (id, ide) = match msg.id() {
        config::MessageId::StandardId(id) => (*id, false),
        config::MessageId::ExtendedId(id) => (*id, true),
    };

    let [sof_signal,
        eof_signal,
        toggle_signal,
        object_entry_id_signal,
        client_id_signal,
        server_id_signal,
        value_signal]: &[Arc<config::signal::Signal>] = &msg.signals().as_slice() else {
        panic!();
    };
    let oe_value: u32 = rng.gen();
    let sof = 1;
    let eof = 1;
    let toggle = 1;
    let object_entry_id = object_entry.id();
    let server_id = object_entry.id();
    let client_id = network_config.nodes().len();

    let mut value = 0;
    value |= (((0xFFFFFFFFFFFFFFFF as u64 >> (64 - sof_signal.size())) & (sof))
        << (64 - sof_signal.size()))
        >> sof_signal.byte_offset();
    value |= (((0xFFFFFFFFFFFFFFFF as u64 >> (64 - eof_signal.size())) & (eof))
        << (64 - eof_signal.size()))
        >> eof_signal.byte_offset();
    value |= (((0xFFFFFFFFFFFFFFFF as u64 >> (64 - toggle_signal.size())) & (toggle))
        << (64 - toggle_signal.size()))
        >> toggle_signal.byte_offset();

    value |= (((0xFFFFFFFFFFFFFFFF as u64 >> (64 - object_entry_id_signal.size()))
        & (object_entry_id as u64))
        << (64 - object_entry_id_signal.size()))
        >> object_entry_id_signal.byte_offset();
    value |= (((0xFFFFFFFFFFFFFFFF as u64 >> (64 - client_id_signal.size())) & (client_id as u64))
        >> (64 - client_id_signal.size()))
        << client_id_signal.byte_offset();
    value |= (((0xFFFFFFFFFFFFFFFF as u64 >> (64 - server_id_signal.size())) & (server_id as u64))
        << (64 - server_id_signal.size()))
        >> server_id_signal.byte_offset();
    value |= (((0xFFFFFFFFFFFFFFFF as u64 >> (64 - value_signal.size())) & (oe_value as u64))
        << (64 - value_signal.size()))
        >> value_signal.byte_offset();

    CanFrame::new(id, ide, false, 8, value)
}

fn random_stream_frame(rng: &mut ThreadRng, network_config: &config::NetworkRef) -> CanFrame {
    let streams: Vec<&Arc<config::stream::Stream>> = network_config
        .nodes()
        .iter()
        .map(|node| node.tx_streams().iter())
        .flatten()
        .collect();
    let stream = streams[rng.gen_range(0..streams.len())];
    let msg = stream.message();

    let (id, ide) = match msg.id() {
        config::MessageId::StandardId(id) => (*id, false),
        config::MessageId::ExtendedId(id) => (*id, true),
    };
    let dlc = 8; //TODO based on msg, but currently not supported by can-config-rs

    let data = rng.gen();

    CanFrame::new(id, ide, false, dlc, data)
}

pub struct MockCan {
    network_ref: config::NetworkRef,
    rng: Mutex<ThreadRng>,
}

impl MockCan {
    pub fn create(network_ref: &config::NetworkRef) -> Self {
        Self {
            network_ref: network_ref.clone(),
            rng: Mutex::new(rand::thread_rng()),
        }
    }

    pub async fn send(&self, frame: CanFrame) {
        println!("mock-can : sending {frame:?}");
    }

    pub async fn receive(&self) -> Result<CanFrame, CanError> {
        // await for random amount of time.
        let timeout: u64 = self
            .rng
            .lock()
            .expect("failed to acquire mock can lock")
            .gen_range(50..100);
        tokio::time::sleep(Duration::from_millis(timeout)).await;

        let mut rng = self.rng.lock().expect("failed to acquire mock can lock");
        let t: u32 = rng.gen_range(0..=1);
        match t {
            0 => Ok(random_get_resp(&mut rng, &self.network_ref)),
            1 => Ok(random_stream_frame(&mut rng, &self.network_ref)),
            _ => panic!(),
        }

        // let message_index = self.rng.lock().expect("failed to acquire mock can lock").gen_range(0..self.network_ref.messages().len());
        // let message_ref = &self.network_ref.messages()[message_index];
        //
        // // signal frame.
        // let (id, ide) = match message_ref.id() {
        //     config::MessageId::StandardId(id) => (*id, false),
        //     config::MessageId::ExtendedId(id) => (*id, true),
        // };
        // let mut dlc = 0;
        // let data = self.rng.lock().expect("failed to acquire mock can lock").gen();
        // for signal in message_ref.signals() {
        //     dlc += signal.size();
        // }
        //
        // Ok(CanFrame::new(
        //     id,
        //     ide,
        //     false,
        //     dlc,
        //     data,
        // ))
    }
    pub async fn receive_err(&mut self) -> CanError {
        // await for random amount of time.
        let timeout: u64 = self
            .rng
            .lock()
            .expect("failed to acquire mock can lock")
            .gen_range(2..10);
        tokio::time::sleep(Duration::from_secs(timeout)).await;

        return CanError::Can(42);
    }
}

unsafe impl Send for MockCan {}
unsafe impl Sync for MockCan {}
