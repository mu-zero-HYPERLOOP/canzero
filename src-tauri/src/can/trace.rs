use std::{collections::HashMap, sync::Mutex};

use serde::Serialize;

use crate::{
    can::frame::{
        error_frame::ErrorFrame, signal_frame::SignalFrame, type_frame::TypeFrame,
        undefined_frame::UndefinedFrame,
    },
    observers::observable_data::ObservableData,
    serialize::serialized_frame::SerializedFrame,
};

use super::frame::{Frame, UniqueFrameKey};

pub struct TraceObject {
    observable: ObservableData<TraceObjectEvent>,
    trace: Mutex<HashMap<UniqueFrameKey, SerializedFrame>>,
}

impl TraceObject {
    pub fn create(app_handle: &tauri::AppHandle) -> Self {
        Self {
            observable: ObservableData::create(
                app_handle,
                "trace",
                tokio::time::Duration::from_millis(1000),
                16,
            ),
            trace: Mutex::new(HashMap::new()),
        }
    }

    pub async fn push_frame(&self, frame: Frame) {
        let key = frame.unique_key();
        let serialized_frame = SerializedFrame::from(frame);
        let prev = self
            .trace
            .lock()
            .expect("failed to acquire TraceObject lock")
            .insert(key, serialized_frame.clone());
        match prev {
            Some(prev) if prev == serialized_frame => (),
            _ => {
                // if nothing is listening to the observable the frame data is dropped completely
                // otherwise the data is forwarded to the view!
                self.observable
                    .notify(TraceObjectEvent(serialized_frame))
                    .await;
            }
        }
    }

    pub fn listen(&self) {
        self.observable.listen();
    }

    pub fn get(&self) -> Vec<TraceObjectEvent> {
        let trace_state : Vec<TraceObjectEvent> = self.trace
                .lock()
                .expect("failed to acquire TraceObject lock")
                .iter()
                .map(|(_key, value)| TraceObjectEvent(value.clone()))
                .collect();
        trace_state
    }

    pub async fn unlisten(&self) {
        self.observable.unlisten().await;
    }
}

#[derive(Clone)]
pub struct TraceObjectEvent(SerializedFrame);

impl Serialize for TraceObjectEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}
