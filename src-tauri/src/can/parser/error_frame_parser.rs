use crate::can::{frame::{Frame, error_frame::ErrorFrame}, can_frame::CanError};


#[derive(Clone)]
pub struct ErrorFrameParser;

impl ErrorFrameParser {
    pub fn new() -> Self {
        Self {
        }
    }

    pub fn parse(&self, frame : &CanError) -> Frame{
        let data = match frame {
            CanError::Io(_) => 0,
            CanError::Disconnect(_) => 0,
            CanError::Can(erno) => erno,
        };
        Frame::ErrorFrame( ErrorFrame::new(data))
    }
}
