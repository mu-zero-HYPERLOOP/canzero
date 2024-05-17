
use std::sync::Arc;

use canzero_config::config::MessageRef;
use canzero_common::TCanFrame;

use crate::cnl::frame::{TFrame, Frame, Value};
use crate::cnl::deserialize::FrameDeserializer;
use crate::cnl::errors::{Result, Error};
use crate::cnl::network::node_object::NodeObject;


pub struct HeartbeatFrameHandler {
    frame_deserializer: FrameDeserializer,
    node_objects: Vec<Arc<NodeObject>>,
    bus_id: u32,
}

struct HeartbeatFrame {
    node_id: u8,
    unregister: bool,
    ticks_next: u8,
}

impl HeartbeatFrame {
    fn new(frame: &Frame) -> Self {
        // not nice! but node_id should be enum in config but dont want to work with strings here
        let node_id = frame.data() & 0xf;
        let Some(Value::UnsignedValue(unregister)) = frame.attribute("unregister") else {
            panic!("DETECTED INVALID CONFIG: invalid format of heartbeat : unregister missing");
        };
        let Some(Value::UnsignedValue(ticks_next)) = frame.attribute("ticks_next") else {
            panic!("DETECTED INVALID CONFIG: invalid format of heartbeat : ticks_next missing");
        };
        HeartbeatFrame {
            node_id: node_id as u8,
            unregister: match unregister {
                0 => false,
                _ => true
            },
            ticks_next: *ticks_next as u8,
        }
    }
}

impl HeartbeatFrameHandler {
    pub fn create(
        heartbeat_message : &MessageRef,
        node_objects: &Vec<Arc<NodeObject>>,
    ) -> Self {
        Self {
            frame_deserializer: FrameDeserializer::new(heartbeat_message),
            node_objects : node_objects.clone(),
            bus_id : heartbeat_message.bus().id(),
        }
    }
    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        let frame = self
            .frame_deserializer
            .deserialize(can_frame.get_data_u64());
        let heartbeat_frame = HeartbeatFrame::new(&frame);
        let Some(node_object) = self.node_objects.iter().find(|n| n.id() == heartbeat_frame.node_id) else {
            return Err(Error::InvalidHeartbeatNodeId);
        };
        node_object.reset_heartbeat_wdg(self.bus_id, heartbeat_frame.unregister).await;
        Ok(can_frame.new_value(frame))
    }
}
