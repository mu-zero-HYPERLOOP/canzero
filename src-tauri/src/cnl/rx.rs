use std::collections::HashMap;
use std::sync::Arc;

use crate::cnl::frame::error_frame::ErrorFrame;
use crate::cnl::frame::undefined_frame::UndefinedFrame;

use super::can_frame::CanError;
use super::can_frame::CanFrame;
use super::frame::Frame;
use super::handler::empty_frame_handler::EmptyFrameHandler;
use super::handler::get_resp_frame_handler::GetRespFrameHandler;
use super::handler::set_resp_frame_handler::SetRespFrameHandler;
use super::handler::MessageHandler;
use super::network::NetworkObject;
use super::parser::type_frame_parser::TypeFrameParser;
use super::parser::MessageParser;
use super::trace::TraceObject;
use can_config_rs::config::Network;

use can_config_rs::config;

pub struct RxCom {
    parser_lookup: Arc<HashMap<(u32, bool), MessageHandler>>,
    trace: Arc<TraceObject>,
}

impl RxCom {
    pub fn create(
        network_config: &config::NetworkRef,
        trace: &Arc<TraceObject>,
        network: &Arc<NetworkObject>,
    ) -> Self {
        let mut lookup = HashMap::new();
        for message_config in network_config.messages() {
            let key = match message_config.id() {
                config::MessageId::StandardId(id) => (*id, false),
                config::MessageId::ExtendedId(id) => (*id, true),
            };
            if network_config.get_resp_message().id() == message_config.id() {
                lookup.insert(
                    key,
                    MessageHandler::GetRespFrameHandler(GetRespFrameHandler::create(
                        TypeFrameParser::new(message_config),
                        network,
                    )),
                );
            } else if (network_config as &Network).set_resp_message().id() == message_config.id() {
                lookup.insert(
                    key,
                    MessageHandler::SetRespFrameHandler(SetRespFrameHandler::create(
                        TypeFrameParser::new(message_config),
                    )),
                );
            } else {
                lookup.insert(
                    key,
                    MessageHandler::EmptyFrameHandler(EmptyFrameHandler::create(
                        MessageParser::create_for_message(message_config),
                    )),
                );
            }
        }

        Self {
            parser_lookup: Arc::new(lookup),
            trace: trace.clone(),
        }
    }
    pub fn start(&mut self, can: &Arc<super::CAN>) {
        tokio::spawn(can_receiver(
            can.clone(),
            self.parser_lookup.clone(),
            self.trace.clone(),
        ));
    }
}

type Lookup = HashMap<(u32, bool), MessageHandler>;
type LookupRef = Arc<Lookup>;

async fn can_receiver(can: Arc<super::CAN>, lookup: LookupRef, trace: Arc<TraceObject>) {
    async fn receive_msg(
        frame: Result<CanFrame, CanError>,
        lookup: LookupRef,
        trace: Arc<TraceObject>,
    ) {
        let frame = match frame {
            Ok(frame) => {
                let key = (frame.get_id(), frame.get_ide_flag());
                match lookup.get(&key) {
                    Some(handler) => handler.handle(&frame),
                    None => Frame::UndefinedFrame(UndefinedFrame::new(
                        frame.get_id(),
                        frame.get_ide_flag(),
                        frame.get_rtr_flag(),
                        frame.get_dlc(),
                        frame.get_data_u64(),
                    )),
                }
            }
            Err(error) => Frame::ErrorFrame(ErrorFrame::new(&error)),
        };
        trace.push_frame(frame).await;
    }

    loop {
        let frame = can.receive().await;
        tokio::spawn(receive_msg(frame, lookup.clone(), trace.clone()));
    }
}
