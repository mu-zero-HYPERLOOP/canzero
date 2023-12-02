use crate::cnl::{can_frame::CanFrame, frame::Frame, parser::MessageParser, timestamped::Timestamped};

pub struct EmptyFrameHandler {
    parser: MessageParser,
}

impl EmptyFrameHandler {
    pub fn create(parser: MessageParser) -> Self {
        Self { parser }
    }

    pub async fn handle(&self, can_frame: &Timestamped<CanFrame>) -> Timestamped<Frame> {
        Timestamped::new(can_frame.timestamp().clone(), self.parser.parse(can_frame))
    }
}
