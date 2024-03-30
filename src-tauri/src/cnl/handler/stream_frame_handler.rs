use std::sync::Arc;

use can_config_rs::config;

use crate::cnl::{
    can_adapter::{can_frame::TCanFrame, timestamped::Timestamped},
    deserialize::FrameDeserializer,
    errors::Result,
    frame::TFrame,
    network::object_entry_object::ObjectEntryObject,
};

pub struct StreamFrameHandler {
    frame_deserializer: FrameDeserializer,
    object_entries: Vec<Arc<ObjectEntryObject>>,
}

impl StreamFrameHandler {
    pub fn create(
        stream: &config::stream::StreamRef,
        stream_object_entry_objects: &Vec<Arc<ObjectEntryObject>>,
    ) -> Self {
        Self {
            frame_deserializer: FrameDeserializer::new(stream.message()),
            object_entries: stream_object_entry_objects.clone(),
        }
    }
    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        let frame = self
            .frame_deserializer
            .deserialize(can_frame.get_data_u64());
        for (attrib, oeo) in frame.attributes().iter().zip(&self.object_entries) {
            oeo.push_value(attrib.value().clone(), can_frame.timestamp()).await
        }

        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}
