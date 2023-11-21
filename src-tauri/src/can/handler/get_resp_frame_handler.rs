use crate::can::{frame::Frame, can_frame::CanFrame, parser::type_frame_parser::TypeFrameParser};



pub struct GetRespFrameHandler {
    parser : TypeFrameParser,
}

impl GetRespFrameHandler {
    pub fn create(parser : TypeFrameParser) -> Self {
        Self {
            parser,
        }
    }
    pub fn handle(&self, frame : &CanFrame) -> Frame {
        let frame = self.parser.parse(frame);
        let Frame::TypeFrame(type_frame) = &frame else {
            panic!();
        };
        frame
    }
}
