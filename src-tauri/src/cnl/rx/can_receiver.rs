use std::sync::Arc;

use can_config_rs::config::MessageRef;

use crate::{
    cnl::{
        can_adapter::{CanAdapter, TCanError, TCanFrame, self},
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
            bus_name : String,
            bus_id : u32,
        ) -> Result<()> {
            match frame {
                Ok(frame) => match receiver_data.lookup.get_handler(frame.key()) {
                    Some(handler) => {
                        let frame = handler.handle(&frame).await?;
                        receiver_data.trace.push_normal_frame(frame, &bus_name, bus_id).await;
                    }
                    None => {
                        receiver_data.trace.push_undefined_frame(frame, &bus_name, bus_id).await;
                    }
                },
                Err(error) => {
                    receiver_data.trace.push_error_frame(error, &bus_name, bus_id).await;
                }
            };
            Ok(())
        }

        async fn pcall(
            frame: std::result::Result<TCanFrame, TCanError>,
            receiver_data: Arc<CanReceiverData>,
            bus_name : String,
            bus_id : u32,
        ) {
            let app_handle = receiver_data.app_handle.clone();
            match receive_msg(frame, receiver_data, bus_name, bus_id).await {
                Ok(_) => (),
                Err(err) => notify_error(&app_handle, err.reason(), err.description(), chrono::Local::now()),
            }
        }

        async fn can_receiver_task(receiver_data: Arc<CanReceiverData>, bus_name : String, bus_id : u32) {
            loop {
                let frame = receiver_data.can_adapter.receive().await;
                let receiver_data = receiver_data.clone();
                let bus_name = bus_name.to_owned();
                tokio::spawn(pcall(frame, receiver_data, bus_name, bus_id));
            }
        }

        async fn can_err_receiver_task(receiver_data: Arc<CanReceiverData>, bus_name : String, bus_id : u32) {
            loop {
                let frame = receiver_data.can_adapter.receive_err().await;
                let receiver_data = receiver_data.clone();
                let bus_name = bus_name.to_owned();
                tokio::spawn(pcall(Err(frame), receiver_data, bus_name, bus_id));
            }
        }
        let bus_name = can_adapter.bus().name().to_owned();
        let bus_id = can_adapter.bus().id();

        tokio::spawn(can_receiver_task(receiver_data.clone(), bus_name.clone(), bus_id));
        tokio::spawn(can_err_receiver_task(receiver_data, bus_name.clone(), bus_id));

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
