use crate::can::{frame::{Frame, error_frame::ErrorFrame}, can_frame::CanError};


#[derive(Clone)]
pub struct ErrorFrameParser;

impl ErrorFrameParser {
    pub fn new() -> Self {
        Self {
        }
    }

    pub fn parse(&self, frame : &CanError) -> Frame{
        Frame::ErrorFrame( ErrorFrame::new(frame))
    }
}
