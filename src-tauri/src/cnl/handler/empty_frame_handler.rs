use crate::cnl::{errors::Result,frame::TFrame, parser::MessageParser, can_adapter::{TCanFrame, timestamped::Timestamped}};


pub struct EmptyFrameHandler {
    parser: MessageParser,
}

impl EmptyFrameHandler {
    pub fn create(parser: MessageParser) -> Self {
        Self { parser }
    }

    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        Ok(Timestamped::new(can_frame.timestamp().clone(), self.parser.parse(can_frame)?))
    }
}
