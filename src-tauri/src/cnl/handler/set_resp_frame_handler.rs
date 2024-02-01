use std::sync::Arc;

use can_config_rs::config::MessageRef;

use crate::cnl::{
    can_adapter::{timestamped::Timestamped, TCanFrame},
    errors::Result,
    frame::TFrame,
    network::NetworkObject, deserialize::FrameDeserializer,
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
        // TODO implement me please!
        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}
