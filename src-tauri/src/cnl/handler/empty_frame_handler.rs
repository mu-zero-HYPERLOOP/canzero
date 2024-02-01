use can_config_rs::config::MessageRef;

use crate::cnl::{
    can_adapter::{timestamped::Timestamped, TCanFrame},
    deserialize::FrameDeserializer,
    errors::Result,
    frame::TFrame,
};

pub struct EmptyFrameHandler {
    frame_deserializer: FrameDeserializer,
}

impl EmptyFrameHandler {
    pub fn create(message_config : &MessageRef) -> Self {
        Self { frame_deserializer : FrameDeserializer::new(message_config)}
    }

    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        Ok(Timestamped::new(
            can_frame.timestamp().clone(),
            self.frame_deserializer
                .deserialize(can_frame.get_data_u64()),
        ))
    }
}
