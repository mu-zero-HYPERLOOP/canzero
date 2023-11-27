use crate::cnl::{
    can_frame::CanError,
    frame::{error_frame::ErrorFrame, Frame},
};

#[derive(Clone)]
pub struct ErrorFrameParser;

impl ErrorFrameParser {
    pub fn new() -> Self {
        Self {}
    }

    pub fn parse(&self, frame: &CanError) -> Frame {
        Frame::ErrorFrame(ErrorFrame::new(frame))
    }
}
