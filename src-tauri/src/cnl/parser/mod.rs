use can_config_rs::config;

use super::parser::signal_frame_parser::SignalFrameParser;
use super::parser::type_frame_parser::TypeFrameParser;
use super::{can_frame::CanFrame, frame::Frame};
use super::errors::Result;

pub mod signal_frame_parser;
pub mod type_frame_parser;

pub enum MessageParser {
    SignalFrameParser(SignalFrameParser),
    TypeFrameParser(TypeFrameParser),
}

impl MessageParser {
    pub fn parse(&self, frame: &CanFrame) -> Result<Frame> {
        match &self {
            MessageParser::SignalFrameParser(signal_handler) => signal_handler.parse(frame),
            MessageParser::TypeFrameParser(type_handler) => type_handler.parse(frame),
        }
    }

    pub fn create_for_message(message_config: &config::MessageRef) -> MessageParser {
        match &message_config.encoding() {
            Some(_) => MessageParser::TypeFrameParser(TypeFrameParser::new(message_config)),
            None => MessageParser::SignalFrameParser(SignalFrameParser::new(message_config)),
        }
    }
}
