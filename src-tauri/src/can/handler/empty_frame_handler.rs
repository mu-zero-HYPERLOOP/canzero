use crate::can::{frame::Frame, can_frame::CanFrame, parser::MessageParser};



pub struct EmptyFrameHandler {
    parser : MessageParser,
}

impl EmptyFrameHandler {
    
    pub fn create(parser : MessageParser) -> Self {
        Self {
            parser
        }
    }
    
    pub fn handle(&self, frame : &CanFrame) -> Frame {
        self.parser.parse(frame)
    }
}
