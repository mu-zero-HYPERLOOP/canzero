use crate::cnl::{can_frame::CanFrame, frame::Frame, parser::type_frame_parser::TypeFrameParser};

pub struct SetRespFrameHandler {
    parser: TypeFrameParser,
}

impl SetRespFrameHandler {
    pub fn create(parser: TypeFrameParser) -> Self {
        Self { parser }
    }
    pub async fn handle(&self, frame: &CanFrame) -> Frame {
        let frame = self.parser.parse(frame);
        let Frame::TypeFrame(_type_frame) = &frame else {
            panic!();
        };
        frame
    }
}
