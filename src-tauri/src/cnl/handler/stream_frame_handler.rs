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
        node_object_entries: &Vec<Arc<ObjectEntryObject>>,
    ) -> Self {
        let mapped_object_entries = stream
            .mapping()
            .into_iter()
            .map(|oe_opt| {
                let oe = oe_opt
                    .to_owned()
                    .expect("expected a tx stream got rx stream");
                node_object_entries
                    .into_iter()
                    .find(|oeo| oe.name() == oeo.name())
                    .expect("the object entries provided don't contain the oe the stream mapps")
                    .clone()
            })
            .collect();
        Self {
            parser: TypeFrameParser::new(stream.message()),
            object_entries: mapped_object_entries,
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
            // at once at least not useful if you think about it !
            oeo.push_value(attrib.value().clone(), can_frame.timestamp())
                .await;
        }

        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}
