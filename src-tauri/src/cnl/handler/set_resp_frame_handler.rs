use crate::cnl::{errors::{Result, Error},frame::{Frame, TFrame}, parser::type_frame_parser::TypeFrameParser, can_adapter::{TCanFrame, timestamped::Timestamped}};

pub struct SetRespFrameHandler {
    parser: TypeFrameParser,
}

impl SetRespFrameHandler {
    pub fn create(parser: TypeFrameParser) -> Self {
        Self { parser }
    }
    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        let frame = self.parser.parse(can_frame)?;
        let Frame::TypeFrame(_type_frame) = &frame else {
            return Err(Error::InvalidSetResponseFormat);
        };
        Ok(Timestamped::new(can_frame.timestamp().clone(),frame))
    }
}
