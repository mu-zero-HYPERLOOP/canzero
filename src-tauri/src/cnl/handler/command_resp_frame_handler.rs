use crate::cnl::{frame::Frame, can_frame::CanFrame, parser::type_frame_parser::TypeFrameParser};



pub struct CommandRespFrameHandler {
    parser : TypeFrameParser,
}

impl CommandRespFrameHandler {
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
