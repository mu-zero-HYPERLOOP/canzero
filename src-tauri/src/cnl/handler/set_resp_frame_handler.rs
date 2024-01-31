use std::sync::Arc;

use can_config_rs::config::MessageRef;

use crate::cnl::{
    can_adapter::{timestamped::Timestamped, TCanFrame},
    errors::{Error, Result},
    frame::{Frame, TFrame},
    network::NetworkObject,
    parser::type_frame_parser::TypeFrameParser,
};

pub struct SetRespFrameHandler {
    parser: TypeFrameParser,
    network_object: Arc<NetworkObject>,
}

impl SetRespFrameHandler {
    pub fn create(network_object: &Arc<NetworkObject>, set_resp_msg: &MessageRef) -> Self {
        Self {
            parser: TypeFrameParser::new(set_resp_msg),
            network_object: network_object.clone(),
        }
    }
    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        let frame = self.parser.parse(can_frame)?;
        let Frame::TypeFrame(_type_frame) = &frame else {
            return Err(Error::InvalidSetResponseFormat);
        };
        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}
