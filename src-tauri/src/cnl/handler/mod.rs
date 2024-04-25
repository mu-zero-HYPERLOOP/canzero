use self::{
    get_resp_frame_handler::GetRespFrameHandler, set_resp_frame_handler::SetRespFrameHandler,
    stream_frame_handler::StreamFrameHandler,
};

use super::errors::Result;
use super::frame::TFrame;

use canzero_common::TCanFrame;

pub mod get_resp_frame_handler;
pub mod set_resp_frame_handler;
pub mod stream_frame_handler;

pub enum MessageHandler {
    GetRespFrameHandler(GetRespFrameHandler),
    SetRespFrameHandler(SetRespFrameHandler),
    StreamFrameHandler(StreamFrameHandler),
}

impl MessageHandler {
    pub async fn handle(&self, frame: &TCanFrame) -> Result<TFrame> {
        match &self {
            MessageHandler::GetRespFrameHandler(handler) => handler.handle(frame).await,
            MessageHandler::SetRespFrameHandler(handler) => handler.handle(frame).await,
            MessageHandler::StreamFrameHandler(handler) => handler.handle(frame).await,
        }
    }
}
