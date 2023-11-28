use crate::cnl::{can_frame::CanFrame, frame::Frame, parser::MessageParser};

pub struct EmptyFrameHandler {
    parser: MessageParser,
}

impl EmptyFrameHandler {
    pub fn create(parser: MessageParser) -> Self {
        Self { parser }
    }

    pub async fn handle(&self, frame: &CanFrame) -> Frame {
        self.parser.parse(frame)
    }
}
