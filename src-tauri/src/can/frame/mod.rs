
use serde::Serialize;

use crate::can::frame::type_frame::TypeFrame;
use crate::can::frame::signal_frame::SignalFrame;
use crate::can::frame::undefined_frame::UndefinedFrame;
use crate::can::frame::error_frame::ErrorFrame;

pub mod error_frame;
pub mod signal_frame;
pub mod type_frame;
pub mod undefined_frame;

/**
 * Serializes to 
 * {
 *   SignalFrame? : SignalFrame
 *   TypeFrame? : TypeFrame,
 *   UndefinedFrame? : UndefinedFrame,
 *   ErrorFrame? : ErrorFrame,
 * }
 */


pub type UniqueFrameKey = (u32, bool);

#[derive(Clone, Serialize, PartialEq)]
pub enum Frame {
    SignalFrame(SignalFrame),
    TypeFrame(TypeFrame),
    UndefinedFrame(UndefinedFrame),
    ErrorFrame(ErrorFrame),
}

impl Frame {
    pub fn name(&self) -> &str{
        match &self {
            Frame::SignalFrame(signal_frame) => signal_frame.name(),
            Frame::TypeFrame(type_frame) => type_frame.name(),
            Frame::UndefinedFrame(undefined_frame) => "undefined",
            Frame::ErrorFrame(error) => "error",
        }
    }
    pub fn unique_key(&self) -> UniqueFrameKey {
        match &self {
            Frame::SignalFrame(signal_frame) => (signal_frame.id(), signal_frame.ide()),
            Frame::TypeFrame(type_frame) => (type_frame.id(), type_frame.ide()),
            Frame::UndefinedFrame(undefined_frame) => (undefined_frame.id(), undefined_frame.ide()),
            Frame::ErrorFrame(error) => (42, false),
        }
    }
}

