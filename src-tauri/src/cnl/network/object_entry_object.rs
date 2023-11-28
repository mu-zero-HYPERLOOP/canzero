use std::{
    sync::{atomic::AtomicUsize, Arc},
    time::Duration,
};

use can_config_rs::config;
use serde::{ser::SerializeMap, Serialize};
use tauri::Manager;
use tokio::sync::{mpsc, Mutex};

use crate::cnl::frame::type_frame::TypeValue;

pub struct ObjectEntryObject {
    object_entry_ref: config::ObjectEntryRef,
    store: Arc<Mutex<ObjectEntryStore>>,
    start_time: std::time::Instant,
    latest_observable: ObjectEntryLatestObservable,
    latest_event_name : String,
    history_event_name : String,
}

impl ObjectEntryObject {
    pub fn create(
        object_entry_config: &config::ObjectEntryRef,
        app_handle: &tauri::AppHandle,
    ) -> Self {
        let latest_event_name = format!("{}_{}_latest", object_entry_config.node().name(), object_entry_config.name());
        let history_event_name = format!("{}_{}_history", object_entry_config.node().name(), object_entry_config.name());
        Self {
            object_entry_ref: object_entry_config.clone(),
            store: Arc::new(Mutex::new(ObjectEntryStore::new())),
            start_time: std::time::Instant::now(),
            latest_observable: ObjectEntryLatestObservable::new(
                &latest_event_name,
                Duration::from_millis(500),
                &app_handle,
            ),
            latest_event_name,
            history_event_name,
        }
    }
    pub fn name(&self) -> &str {
        self.object_entry_ref.name()
    }
    pub fn description(&self) -> Option<&str> {
        self.object_entry_ref.description()
    }
    pub fn id(&self) -> u32 {
        self.object_entry_ref.id()
    }
    pub fn unit(&self) -> Option<&str> {
        self.object_entry_ref.unit()
    }
    pub fn latest_event_name(&self) -> &str {
        &self.latest_event_name
    }

    pub fn history_event_name(&self) -> &str {
        &self.history_event_name
    }

    pub async fn push_value(&self, value: TypeValue) {
        let arrive_instance = std::time::Instant::now();
        
        let mut store = self.store.lock().await;
        let timestamp = arrive_instance.duration_since(self.start_time);
        let delta_time = match store.latest_value() {
            Some(latest) => timestamp.saturating_sub(latest.timestamp), //Not sure if saturating
                                                                        //sub is correct here
            None => timestamp,
        };
        
        let event = ObjectEntryEvent {
            value,
            timestamp,
            delta_time,
        };
        
        
        self.latest_observable.notify(&event).await;
        store.push_event(event);
    }
    pub fn ty(&self) -> &config::TypeRef {
        &self.object_entry_ref.ty()
    }

    // Latest Events Issue #12


    #[allow(unused)] //FIXME
    pub fn listen_to_latest(&self) {
        self.latest_observable.listen(&self.store);
    }
    pub async fn unlisten_from_latest(&self) {
        self.latest_observable.unlisten().await;
    }
    pub async fn latest(&self) -> Option<ObjectEntryEvent> {
        self.store.lock().await.latest_value().cloned()
    }

    // History Events Issue #13

    #[allow(unused)] //FIXME
    pub fn listen_to_history(&self) {
        //TODO register a listener to the history
    }

    pub async fn unlisten_from_history(&self) {
        //TODO unregister a listener of the history
    }

    pub async fn history(&self) -> Vec<ObjectEntryEvent> {
        self.store.lock().await.complete_history().clone()
    }
}

#[derive(Debug, Clone)]
pub struct ObjectEntryEvent {
    value: TypeValue,
    timestamp: Duration,
    delta_time: Duration,
}

impl Serialize for ObjectEntryEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut ser_map = serializer.serialize_map(Some(3))?;
        ser_map.serialize_entry("value", &self.value)?;
        ser_map.serialize_entry(
            "timestamp",
            &(self.timestamp.as_millis() % u64::MAX as u128),
        )?;
        ser_map.serialize_entry(
            "delta_time",
            &(self.delta_time.as_micros() % u64::MAX as u128),
        )?;

        ser_map.end()
    }
}

struct ObjectEntryStore {
    history: Vec<ObjectEntryEvent>,
}

impl ObjectEntryStore {
    pub fn new() -> Self {
        Self { history: vec![] }
    }


    #[allow(unused)] //FIXME
    pub fn complete_history(&self) -> &Vec<ObjectEntryEvent> {
        &self.history
    }

    pub fn latest_value(&self) -> Option<&ObjectEntryEvent> {
        self.history.last()
    }
    pub fn push_event(&mut self, value: ObjectEntryEvent) {
        self.history.push(value);
    }
}

enum ObjectEntryEventMsg {
    Poison,
    Value(ObjectEntryEvent),
}

struct ObjectEntryLatestObservable {
    min_interval: Duration,
    event_name: String,
    listen_count: AtomicUsize,
    app_handle: tauri::AppHandle,

    tx: mpsc::Sender<ObjectEntryEventMsg>,
    rx: Arc<Mutex<mpsc::Receiver<ObjectEntryEventMsg>>>,
}

impl ObjectEntryLatestObservable {
    pub fn new(event_name: &str, min_interval: Duration, app_handle: &tauri::AppHandle) -> Self {
        let (tx, rx) = mpsc::channel(10);
        Self {
            event_name: event_name.to_owned(),
            listen_count: AtomicUsize::new(0),
            min_interval,
            app_handle: app_handle.clone(),
            rx: Arc::new(Mutex::new(rx)),
            tx,
        }
    }

    pub async fn notify(&self, value : &ObjectEntryEvent) {
        if self.listen_count.load(std::sync::atomic::Ordering::SeqCst) != 0 {
            self.tx.send(ObjectEntryEventMsg::Value(value.clone())).await.unwrap();
        }
    }

    pub fn listen(&self, store: &Arc<Mutex<ObjectEntryStore>>) {
        let prev_count = self
            .listen_count
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        if prev_count == 0 {
            // this indicates that the batching task should be started
            self.start_notify_task(store);
        }
    }


    #[allow(unused)] //FIXME
    pub async fn unlisten(&self) {
        let prev_count = self
            .listen_count
            .fetch_sub(1, std::sync::atomic::Ordering::SeqCst);
        if prev_count == 1 {
            // this indicates that the batching task should be stoped
            self.stop_notify_task().await;
        }
    }

    pub fn start_notify_task(&self, store: &Arc<Mutex<ObjectEntryStore>>) {
        tokio::spawn(Self::notify_task(
            self.event_name.clone(),
            self.min_interval.clone(),
            self.app_handle.clone(),
            self.rx.clone(),
            store.clone(),
        ));
    }

    pub async fn stop_notify_task(&self) {
        self.tx
            .send(ObjectEntryEventMsg::Poison)
            .await
            .expect("failed to send posion message");
    }

    pub async fn notify_task(
        event_name: String,
        min_interval: Duration,
        app_handle: tauri::AppHandle,
        rx: Arc<Mutex<mpsc::Receiver<ObjectEntryEventMsg>>>,
        store: Arc<Mutex<ObjectEntryStore>>,
    ) {
        println!("start notify task for {event_name}");
        let mut rx = rx.lock().await;
        let mut next_batch_time = tokio::time::Instant::now();
        let mut timeout = tokio::time::Instant::now() + Duration::from_secs(0xFFFF);
        loop {
            match tokio::time::timeout_at(timeout, rx.recv()).await {
                Ok(opt) => {
                    match opt {
                        Some(ObjectEntryEventMsg::Poison) => {
                            match store.lock().await.latest_value() {
                                Some(latest) => {
                                    // println!("emit {event_name} = {latest:?}");
                                    app_handle.emit_all(&event_name, latest).unwrap();
                                }
                                None => (),
                            };
                            break;
                        }
                        Some(ObjectEntryEventMsg::Value(value)) => {
                            // only send batch if the last interval is min_interval in the past!
                            if next_batch_time <= tokio::time::Instant::now() {
                                // println!("emit {event_name} = {value:?}");
                                app_handle.emit_all(&event_name, value).unwrap();
                                next_batch_time = tokio::time::Instant::now() + min_interval;
                                timeout = next_batch_time;
                            }
                        }
                        None => {
                            panic!("rx_receiver closed early");
                        }
                    };
                }
                Err(_elapsed) => {
                    match store.lock().await.latest_value() {
                        Some(latest) => {
                            // println!("emit {event_name} = {latest:?}");
                            app_handle.emit_all(&event_name, latest).unwrap();
                            next_batch_time = tokio::time::Instant::now() + min_interval;
                        }
                        None => (),
                    };
                    timeout += Duration::from_secs(0xFFFF); //wait for ever!
                }
            }
        }
        println!("stop notify task for {event_name}");
    }
}
