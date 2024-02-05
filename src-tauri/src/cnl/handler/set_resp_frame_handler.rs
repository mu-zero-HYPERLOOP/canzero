use std::sync::Arc;

use can_config_rs::config::MessageRef;

use crate::cnl::{
    can_adapter::{timestamped::Timestamped, TCanFrame},
    errors::Result,
    frame::TFrame,
    network::{NetworkObject, node_object}, deserialize::FrameDeserializer,
};

pub struct SetRespFrameHandler {
    frame_deserializer: FrameDeserializer,
    network_object: Arc<NetworkObject>,
}

impl SetRespFrameHandler {
    pub fn create(network_object: &Arc<NetworkObject>, set_resp_msg: &MessageRef) -> Self {
        Self {
            frame_deserializer : FrameDeserializer::new(set_resp_msg),
            network_object: network_object.clone(),
        }
    }
    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        let frame = self.frame_deserializer.deserialize(can_frame.get_data_u64());
        // TODO: replace with decent getter through parsed attr. currently not exposed by config?
        let server_id = ((frame.data() >> 24) & 0xff) as u8;
        let oe_id = ((frame.data() >> 3) & 0x1fff) as u32;
        let node_object = self.network_object.nodes().iter().find(|n| (n.id() as u8) == server_id);
        if let Some(node_object) = node_object {
            if let Some(oe_object) = node_object.object_entries().iter().find(|oe| oe.id() == oe_id) {
                // TODO: replace with actual value from message
                oe_object.push_set_response(Ok(()))
            } else {
                // ignore or notify instead??
                panic!("object entry with given node does not exist");
            };
        } else {
            // just ignore instead?
            panic!("node with given id does not exist");
        };

        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}
