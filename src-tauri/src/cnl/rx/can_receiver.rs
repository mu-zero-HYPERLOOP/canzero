use std::sync::Arc;

use can_config_rs::config::MessageRef;

use crate::{
    cnl::{
        can_adapter::{timestamped::Timestamped, CanAdapter, TCanError, TCanFrame},
        network::NetworkObject,
        rx::handler_lookup::HandlerLookup,
        trace::TraceObject,
    },
    notification::notify_error,
};

use crate::cnl::errors::Result;

pub struct CanReceiver();

impl CanReceiver {
    pub fn create(
        can_adapter: &Arc<CanAdapter>,
        messages: &Vec<MessageRef>,
        trace: &Arc<TraceObject>,
        network_object: &Arc<NetworkObject>,
        app_handle: &tauri::AppHandle,
    ) -> Self {
        let receiver_data = Arc::new(CanReceiverData::create(
            can_adapter,
            messages,
            trace,
            network_object,
            app_handle,
        ));
        async fn receive_msg(
            frame: std::result::Result<TCanFrame, TCanError>,
            receiver_data: Arc<CanReceiverData>,
        ) -> Result<()> {
            match frame {
                Ok(frame) => match receiver_data.lookup.get_handler(frame.key()) {
                    Some(handler) => {
                        let frame = handler.handle(&frame).await?;
                        receiver_data.trace.push_frame(frame);
                    }
                    None => {
                        receiver_data.trace.push_undefined_frame(frame);
                    }
                },
                Err(error) => {
                    receiver_data.trace.push_error_frame(error);
                }
            };
            Ok(())
        }

        async fn pcall(
            frame: std::result::Result<TCanFrame, TCanError>,
            receiver_data: Arc<CanReceiverData>,
        ) {
            let app_handle = receiver_data.app_handle.clone();
            match receive_msg(frame, receiver_data).await {
                Ok(_) => (),
                Err(err) => notify_error(&app_handle, err.reason(), err.description()),
            }
        }

        async fn can_receiver_task(receiver_data: Arc<CanReceiverData>) {
            loop {
                let frame = receiver_data.can_adapter.receive().await;
                let receiver_data = receiver_data.clone();
                tokio::spawn(pcall(frame, receiver_data));
            }
        }

        async fn can_err_receiver_task(receiver_data: Arc<CanReceiverData>) {
            loop {
                let frame = receiver_data.can_adapter.receive_err().await;
                let receiver_data = receiver_data.clone();
                tokio::spawn(pcall(Err(frame), receiver_data));
            }
        }

        tokio::spawn(can_receiver_task(receiver_data.clone()));
        tokio::spawn(can_err_receiver_task(receiver_data));

        Self()
    }
}

struct CanReceiverData {
    can_adapter: Arc<CanAdapter>,
    trace: Arc<TraceObject>,
    app_handle: tauri::AppHandle,
    lookup: HandlerLookup,
}

impl CanReceiverData {
    pub fn create(
        can_adapter: &Arc<CanAdapter>,
        messages: &Vec<MessageRef>,
        trace: &Arc<TraceObject>,
        network_object: &Arc<NetworkObject>,
        app_handle: &tauri::AppHandle,
    ) -> Self {
        Self {
            can_adapter: can_adapter.clone(),
            trace: trace.clone(),
            app_handle: app_handle.clone(),
            lookup: HandlerLookup::create(
                &messages
                    .clone()
                    .into_iter()
                    .filter(|msg| msg.bus().id() == can_adapter.bus().id())
                    .collect(),
                network_object,
            ),
        }
    }
}
