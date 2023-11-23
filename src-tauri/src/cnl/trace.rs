use std::{collections::HashMap, sync::Mutex};

use serde::Serialize;

use crate::observers::observable_data::ObservableData;

use super::frame::{Frame, UniqueFrameKey};

pub struct TraceObject {
    observable: ObservableData<TraceObjectEvent>,
    trace: Mutex<HashMap<UniqueFrameKey, Frame>>,
}

impl TraceObject {
    pub fn create(app_handle: &tauri::AppHandle) -> Self {
        Self {
            observable: ObservableData::create(
                app_handle,
                "trace",
                tokio::time::Duration::from_millis(200),
                2048,
            ),
            trace: Mutex::new(HashMap::new()),
        }
    }

    pub async fn push_frame(&self, frame: Frame) {
        // TODO Issue #7 
        // We should calculate a timestamp here and forward it correctly to the view
        let key = frame.unique_key();
        let prev = self
            .trace
            .lock()
            .expect("failed to acquire TraceObject lock")
            .insert(key, frame.clone());
        match prev {
            Some(prev) if prev == frame => (),
            _ => {
                // if nothing is listening to the observable the frame data is dropped completely
                // otherwise the data is forwarded to the view!
                self.observable
                    .notify(TraceObjectEvent(frame))
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
pub struct TraceObjectEvent(Frame);

impl Serialize for TraceObjectEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.0.serialize(serializer)
    }
}
