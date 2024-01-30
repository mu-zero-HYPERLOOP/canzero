use std::collections::HashMap;
use std::sync::Arc;

use crate::cnl::frame::error_frame::ErrorFrame;
use crate::cnl::frame::undefined_frame::UndefinedFrame;
use crate::cnl::timestamped::Timestamped;
use crate::notification::NotificationStream;
use super::errors::Result;

use super::can_frame::CanError;
use super::can_frame::CanFrame;
use super::frame::Frame;
use super::handler::empty_frame_handler::EmptyFrameHandler;
use super::handler::get_resp_frame_handler::GetRespFrameHandler;
use super::handler::set_resp_frame_handler::SetRespFrameHandler;
use super::handler::stream_frame_handler::StreamFrameHandler;
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
    app_handle: tauri::AppHandle,
}

impl RxCom {
    pub fn create(
        network_config: &config::NetworkRef,
        trace: &Arc<TraceObject>,
        network: &Arc<NetworkObject>,
        app_handle: &tauri::AppHandle,
    ) -> Self {
        let mut lookup = HashMap::new();
        for message_config in network_config.messages() {
            let key = match message_config.id() {
                config::MessageId::StandardId(id) => (*id, false),
                config::MessageId::ExtendedId(id) => (*id, true),
            };
            for node in network_config.nodes() {
                for tx_stream in node.tx_streams() {
                    if tx_stream.message().id() == message_config.id() {
                        lookup.insert(
                            key,
                            MessageHandler::StreamFrameHandler(StreamFrameHandler::create(
                                tx_stream,
                                network
                                    .nodes()
                                    .iter()
                                    .find(|n| n.id() == node.id())
                                    .expect("invalid network")
                                    .object_entries(),
                            )),
                        );
                        continue;
                    }
                }
            }

            if network_config.get_resp_message().id() == message_config.id() {
                lookup.insert(
                    key,
                    MessageHandler::GetRespFrameHandler(GetRespFrameHandler::create(
                        TypeFrameParser::new(message_config),
                        network,
                        network_config.get_resp_message(),
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
            app_handle: app_handle.clone(),
        }
    }
    pub fn start(&mut self, can: &Arc<super::CanAdapter>) {
        tokio::spawn(can_receiver(
            can.clone(),
            self.parser_lookup.clone(),
            self.trace.clone(),
            self.app_handle.clone(),
        ));
    }
}

type Lookup = HashMap<(u32, bool), MessageHandler>;
type LookupRef = Arc<Lookup>;

async fn can_receiver(
    can: Arc<super::CanAdapter>,
    lookup: LookupRef,
    trace: Arc<TraceObject>,
    app_handle: tauri::AppHandle,
) {
    async fn receive_msg(
        frame: std::result::Result<Timestamped<CanFrame>, Timestamped<CanError>>,
        lookup: LookupRef,
        trace: Arc<TraceObject>,
    ) -> Result<()> {
        let frame = match frame {
            Ok(frame) => {
                let key = (frame.get_id(), frame.get_ide_flag());
                match lookup.get(&key) {
                    Some(handler) => handler.handle(&frame).await?,
                    None => Timestamped::new(
                        frame.timestamp().clone(),
                        Frame::UndefinedFrame(UndefinedFrame::new(
                            frame.get_id(),
                            frame.get_ide_flag(),
                            frame.get_rtr_flag(),
                            frame.get_dlc(),
                            frame.get_data_u64(),
                        )),
                    ),
                }
            }
            Err(error) => Timestamped::new(
                error.timestamp().clone(),
                Frame::ErrorFrame(ErrorFrame::new(&error)),
            ),
        };
        trace.push_frame(frame).await;
        Ok(())
    }

    let notification_stream = NotificationStream::new(&app_handle);
    loop {
        let lookup = lookup.clone();
        let trace = trace.clone();
        let notification_stream = notification_stream.clone();
        let frame = can.receive().await;
        tokio::spawn(async move { 
            match receive_msg(frame, lookup, trace).await {
                Ok(_) => (),
                Err(err) => {
                    notification_stream.notify_error(err.reason(), err.description());
                }
            }
        });
    }
}
