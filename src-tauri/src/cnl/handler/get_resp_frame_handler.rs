use std::{collections::HashMap, sync::Arc, time::Duration};

use bitvec::view::AsBits;
use can_config_rs::config;

use crate::cnl::{
    deserialize::{type_deserializer::TypeDeserializer, FrameDeserializer},
    errors::{Error, Result},
    frame::{Frame, TFrame, Value},
    network::{object_entry_object::ObjectEntryObject, NetworkObject},
};

use canzero_common::TCanFrame;

struct GetRespFrame {
    sof: bool,
    eof: bool,
    toggle: bool,
    server_id: u8,
    object_entry_id: u16,
    data: u32,
}

impl GetRespFrame {
    pub fn new(frame: &Frame) -> Self {
        let Some(header) = frame.attribute("header") else {
            panic!("DETECTED INVALID CONFIG: invalid format of get_resp_frame : header missing");
        };
        let Some(Value::UnsignedValue(sof)) = header.attribute("sof") else {
            panic!(
                "DETECTED INVALID CONFIG: invalid format of get_resp_frame : header.sof missing"
            );
        };
        let Some(Value::UnsignedValue(eof)) = header.attribute("eof") else {
            panic!(
                "DETECTED INVALID CONFIG: invalid format of get_resp_frame : header.eof missing"
            );
        };
        let Some(Value::UnsignedValue(toggle)) = header.attribute("toggle") else {
            panic!(
                "DETECTED INVALID CONFIG: invalid format of get_resp_frame : header.toggle missing"
            );
        };
        let Some(Value::UnsignedValue(object_entry_id)) = header.attribute("od_index") else {
            panic!("DETECTED INVALID CONFIG: invalid format of get_resp_frame : header.od_index missing");
        };
        let Some(Value::UnsignedValue(server_id)) = header.attribute("server_id") else {
            panic!("DETECTED INVALID CONFIG: invalid format of get_resp_frame : header.server_id missing");
        };
        let Some(Value::UnsignedValue(data)) = frame.attribute("data") else {
            panic!(
                "DETECTED INVALID CONFIG: invalid format of get_resp_frame : header.data missing"
            );
        };
        Self {
            sof: *sof != 0,
            eof: *eof != 0,
            toggle: *toggle != 0,
            server_id: *server_id as u8,
            object_entry_id: *object_entry_id as u16,
            data: *data as u32,
        }
    }
}

enum GetRespState {
    Ready,
    // NOTE expecting toggle low on the next frame!
    FragmentationToggleLow,
    FragmentationToggleHigh,
}

struct GetResp {
    state: GetRespState,
    object_entry: Arc<ObjectEntryObject>,
    type_deserializer: TypeDeserializer,
    size: u32,
    buffer: Vec<u32>,
}

impl GetResp {
    async fn receive(&mut self, frame: GetRespFrame, timestamp: &Duration) -> Result<()> {
        let (expected_sof, expected_toggle) = match &self.state {
            GetRespState::Ready => (true, false),
            GetRespState::FragmentationToggleLow => (false, false),
            GetRespState::FragmentationToggleHigh => (false, true),
        };
        let expected_eof = (self.buffer.len() + 1) as u32 == self.size.div_ceil(32);

        if expected_sof != frame.sof {
            return Err(Error::InvalidGetResponseSofFlag);
        }
        if expected_toggle != frame.toggle {
            return Err(Error::InvalidGetResponseToggleFlag);
        }
        if expected_eof != frame.eof {
            return Err(Error::InvalidGetResponseEofFlag);
        }

        assert_eq!(frame.object_entry_id, self.object_entry.id() as u16);
        self.buffer.push(frame.data);

        if frame.eof {
            let value = self
                .type_deserializer
                .deserialize(&self.buffer.as_slice().as_bits());
            self.object_entry.push_get_response(value, timestamp).await;
            self.state = GetRespState::Ready;
            self.buffer.clear();
        } else {
            // update fragmentation state!
            self.state = match self.state {
                GetRespState::Ready => GetRespState::FragmentationToggleHigh,
                GetRespState::FragmentationToggleLow => GetRespState::FragmentationToggleHigh,
                GetRespState::FragmentationToggleHigh => GetRespState::FragmentationToggleLow,
            }
        }
        Ok(())
    }
}

#[derive(PartialEq, Eq, Hash)]
struct GetRespIdentifier {
    server_id: u8,
    object_entry_id: u16,
}

pub struct GetRespFrameHandler {
    frame_deserializer: FrameDeserializer,
    get_resp_lookup: HashMap<GetRespIdentifier, tokio::sync::Mutex<GetResp>>,
}

impl GetRespFrameHandler {
    pub fn create(network: &Arc<NetworkObject>, get_resp_msg: &config::MessageRef) -> Self {
        let mut get_resp_lookup = HashMap::new();
        for node in network.nodes() {
            let node_id = node.id() as u8;
            for object_entry in node.object_entries() {
                get_resp_lookup.insert(
                    GetRespIdentifier {
                        server_id: node_id,
                        object_entry_id: object_entry.id() as u16,
                    },
                    tokio::sync::Mutex::new(GetResp {
                        object_entry: object_entry.clone(),
                        buffer: vec![],
                        state: GetRespState::Ready,
                        size: object_entry.ty().size(),
                        type_deserializer: TypeDeserializer::new(object_entry.ty()),
                    }),
                );
            }
        }
        Self {
            frame_deserializer: FrameDeserializer::new(get_resp_msg),
            get_resp_lookup,
        }
    }

    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        
        let frame = self
            .frame_deserializer
            .deserialize(can_frame.get_data_u64());

        let get_resp_frame = GetRespFrame::new(&frame);

        let get_resp_identifier = GetRespIdentifier {
            server_id: get_resp_frame.server_id,
            object_entry_id: get_resp_frame.object_entry_id,
        };

        // lookup the correct GetResp "similar to handlers"
        let Some(get_resp) = self.get_resp_lookup.get(&get_resp_identifier) else {
            return Err(Error::InvalidGetResponseServerOrObjectEntryNotFound);
        };

        get_resp
            .lock()
            .await
            .receive(get_resp_frame, &can_frame.timestamp)
            .await?;

        Ok(can_frame.new_value(frame))
    }
}
