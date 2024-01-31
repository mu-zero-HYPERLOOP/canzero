use std::sync::Arc;

use can_config_rs::config;

use crate::cnl::{
    errors::Result,
    errors::Error,
    frame::{Frame, TFrame}, network::object_entry_object::ObjectEntryObject,
    parser::type_frame_parser::TypeFrameParser, can_adapter::{TCanFrame, timestamped::Timestamped}
};

pub struct StreamFrameHandler {
    parser: TypeFrameParser,
    object_entries: Vec<Arc<ObjectEntryObject>>,
}

impl StreamFrameHandler {
    #[allow(unused)]
    pub fn create(
        stream: &config::stream::StreamRef,
        stream_object_entry_objects: &Vec<Arc<ObjectEntryObject>>,
    ) -> Self {
        Self {
            parser: TypeFrameParser::new(stream.message()),
            object_entries: stream_object_entry_objects.clone(),
        }
    }
    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        let frame = self.parser.parse(can_frame)?;
        let Frame::TypeFrame(type_frame) = &frame else {
            return Err(Error::InvalidStreamMessageFormat);
        };
        for (attrib, oeo) in type_frame.value().iter().zip(&self.object_entries) {
            // notify the oeo one after another
            // Interesstingly not possible in rusts async model to await all
            // at once at least not useful if you think about it =^)
            oeo.push_value(attrib.value().clone(), can_frame.timestamp())
                .await;
        }

        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}
