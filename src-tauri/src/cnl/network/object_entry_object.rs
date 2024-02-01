use std::{
    sync::{
        atomic::{AtomicU64, AtomicUsize},
        Arc,
    },
    time::Duration,
};

use can_config_rs::config;
use serde::{ser::SerializeMap, Serialize};
use tauri::Manager;
use tokio::sync::{mpsc, Mutex};

use crate::cnl::{tx::TxCom, frame::Value};

pub struct ObjectEntryObject {
    object_entry_ref: config::ObjectEntryRef,
    store: Arc<Mutex<ObjectEntryStore>>,
    start_time: std::time::Instant,
    latest_observable: ObjectEntryLatestObservable,
    latest_event_name: String,
    history_observables: Mutex<Vec<ObjectEntryHistroyObservable>>,
    history_observables_id_acc: AtomicU64,
    history_event_name_prefix: String,
    app_handle: tauri::AppHandle,
    tx_com: Arc<TxCom>,
}

impl ObjectEntryObject {
    pub fn create(
        object_entry_config: &config::ObjectEntryRef,
        app_handle: &tauri::AppHandle,
        tx_com: Arc<TxCom>,
    ) -> Self {
        let latest_event_name = format!(
            "{}_{}_latest",
            object_entry_config.node().name(),
            object_entry_config.name()
        );
        let history_event_name = format!(
            "{}_{}_history",
            object_entry_config.node().name(),
            object_entry_config.name()
        );
        println!("latest_name = {latest_event_name}");
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
            history_observables: Mutex::new(vec![]),
            history_observables_id_acc: AtomicU64::new(0),
            history_event_name_prefix: history_event_name,
            app_handle: app_handle.clone(),
            tx_com
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
    pub fn node_id(&self) -> u8 {
        self.object_entry_ref.node().id() as u8
    }

    pub async fn push_value(&self, value: Value, arrive_instance: &std::time::Instant) {
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

        // The value has to be stored before notify because the observables
        // use the values in the store directly to reduce clones
        store.push_event(event);
        self.latest_observable.notify().await;
        for history_observable in self.history_observables.lock().await.iter() {
            history_observable.notify().await;
        }
    }
    pub fn ty(&self) -> &config::TypeRef {
        &self.object_entry_ref.ty()
    }

    fn tx(&self) -> Arc<TxCom> {
        self.tx_com.clone()
    }

    pub fn listen_to_latest(&self) {
        self.latest_observable.listen(&self.store);
    }
    pub async fn unlisten_from_latest(&self) {
        self.latest_observable.unlisten().await;
    }
    pub async fn latest(&self) -> Option<ObjectEntryEvent> {
        self.store.lock().await.latest_value().cloned()
    }

    pub async fn listen_to_history(
        &self,
        frame_size: Duration,
        min_interval: Duration,
    ) -> (String, Vec<ObjectEntryEvent>) {
        let store_lock = self.store.lock().await;
        let history = &store_lock.history;
        let now = std::time::Instant::now().duration_since(self.start_time);
        let breakpoint = now.saturating_sub(frame_size);
        let mut breakpoint_index = None;
        for (i, event) in history.iter().enumerate().rev() {
            if event.timestamp <= breakpoint {
                breakpoint_index = Some(i);
                break;
            }
        }
        let start_index = breakpoint_index.unwrap_or(0);
        let history_of = history[start_index..].to_vec();
        drop(store_lock);

        // create a custom event_name for the
        let event_name = format!(
            "{}_{}",
            self.history_event_name_prefix,
            self.history_observables_id_acc
                .fetch_add(1, std::sync::atomic::Ordering::SeqCst)
        );
        let new_history_observable = ObjectEntryHistroyObservable::new(
            &event_name,
            min_interval,
            frame_size,
            &self.app_handle,
            start_index,
            self.start_time,
        );
        new_history_observable.start_notify_task(&self.store).await;
        self.history_observables
            .lock()
            .await
            .push(new_history_observable);

        (event_name, history_of)
    }

    pub async fn unlisten_from_history(&self, event_name: &str) {
        let mut history_observables = self.history_observables.lock().await;
        let mut remove = None;
        for (i, observable) in history_observables.iter_mut().enumerate() {
            if &observable.event_name == event_name {
                observable.stop_notify_task().await;
                remove = Some(i);
                break;
            }
        }
        let Some(remove_index) = remove else {
            panic!("Failed to unlisten from object entry history {event_name}");
        };
        history_observables.remove(remove_index);
    }

    pub fn set_request(&self, value: Value) {
        let (bit_value, last_fill) = value.get_as_bin(self.ty());
        let server_id = self.node_id();
        let oe_id = self.id();
        self.tx().send_set_request(server_id, oe_id, bit_value, last_fill);
    }
}

#[derive(Debug, Clone)]
pub struct ObjectEntryEvent {
    value: Value,
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

    pub fn latest_value(&self) -> Option<&ObjectEntryEvent> {
        self.history.last()
    }
    pub fn push_event(&mut self, value: ObjectEntryEvent) {
        self.history.push(value);
    }
}

enum ObjectEntryEventMsg {
    Poison,
    Value,
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

    pub async fn notify(&self) {
        if self.listen_count.load(std::sync::atomic::Ordering::SeqCst) != 0 {
            self.tx.send(ObjectEntryEventMsg::Value).await.unwrap();
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
                        Some(ObjectEntryEventMsg::Value) => {
                            // only send batch if the last interval is min_interval in the past!
                            if next_batch_time <= tokio::time::Instant::now() {
                                // println!("emit {event_name} = {:?}", store.lock().await.latest_value());
                                app_handle
                                    .emit_all(&event_name, store.lock().await.latest_value())
                                    .unwrap();
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

#[derive(serde::Serialize, Clone)]
struct ObjectEntryHistoryEvent {
    new_values: Vec<ObjectEntryEvent>,
    deprecated_count: usize,
}

struct ObjectEntryHistroyObservable {
    min_interval: Duration,
    frame_size: Duration,
    event_name: String,
    app_handle: tauri::AppHandle,

    tx: mpsc::Sender<ObjectEntryEventMsg>,
    rx: Arc<Mutex<mpsc::Receiver<ObjectEntryEventMsg>>>,

    start_index: usize,
    start_time: std::time::Instant,
}

impl ObjectEntryHistroyObservable {
    pub fn new(
        event_name: &str,
        min_interval: Duration,
        frame_size: Duration,
        app_handle: &tauri::AppHandle,
        start_index: usize,
        start_time: std::time::Instant,
    ) -> Self {
        let (tx, rx) = mpsc::channel(10);
        Self {
            event_name: event_name.to_owned(),
            min_interval,
            frame_size,
            app_handle: app_handle.clone(),
            tx,
            rx: Arc::new(Mutex::new(rx)),
            start_index,
            start_time,
        }
    }

    pub async fn notify(&self) {
        // intentionally ignore the result!
        match self.tx.send(ObjectEntryEventMsg::Value).await {
            Ok(_) => (),
            Err(_) => (),
        }
    }

    pub async fn start_notify_task(&self, store: &Arc<Mutex<ObjectEntryStore>>) {
        tokio::spawn(Self::notify_task(
            self.event_name.clone(),
            self.min_interval,
            self.frame_size,
            self.app_handle.clone(),
            self.rx.clone(),
            store.clone(),
            store.lock().await.history.len(),
            self.start_index,
            self.start_time,
        ));
    }

    pub async fn stop_notify_task(&self) {
        self.tx
            .send(ObjectEntryEventMsg::Poison)
            .await
            .expect("failed to send poison to object entry history notify task");
    }

    async fn notify_task(
        event_name: String,
        min_interval: Duration,
        frame_size: Duration,
        app_handle: tauri::AppHandle,
        rx: Arc<Mutex<mpsc::Receiver<ObjectEntryEventMsg>>>,
        store: Arc<Mutex<ObjectEntryStore>>,
        latest_index: usize,
        start_index: usize,
        start_time: std::time::Instant,
    ) {
        println!("start notify task for {event_name}");
        let mut start_index = start_index;
        let mut latest_index = latest_index;
        let mut rx = rx.lock().await;
        let mut next_batch_time = tokio::time::Instant::now();
        let mut timeout = tokio::time::Instant::now() + Duration::from_secs(0xFFFF);
        loop {
            match tokio::time::timeout_at(timeout, rx.recv()).await {
                Ok(opt) => {
                    match opt {
                        Some(ObjectEntryEventMsg::Poison) => {
                            let store_lock = store.lock().await;
                            if store_lock.history.len() < latest_index {
                                let mut deprecated_count = 0;

                                let now = std::time::Instant::now().duration_since(start_time);
                                let breakpoint = now.saturating_sub(frame_size);
                                for event in store_lock.history[start_index..].iter() {
                                    if event.timestamp >= breakpoint {
                                        break;
                                    }
                                    deprecated_count += 1;
                                }

                                let payload = store_lock.history[latest_index..].to_vec();
                                // println!("emit {event_name} = [{:?}]", payload.len());
                                app_handle
                                    .emit_all(
                                        &event_name,
                                        ObjectEntryHistoryEvent {
                                            new_values: payload,
                                            deprecated_count,
                                        },
                                    )
                                    .unwrap();
                            }
                            break;
                        }
                        Some(ObjectEntryEventMsg::Value) => {
                            // only send batch if the last interval is min_interval in the past!

                            if next_batch_time <= tokio::time::Instant::now() {
                                let store_lock = store.lock().await;
                                // should never be false because the store should be updated before
                                // the notify (otherwise notify should not be called)
                                // println!("trying to emit event {event_name}, latest = {latest_index}, history_len = {}", store_lock.history.len());
                                if store_lock.history.len() > latest_index {
                                    // go up from start_index and count how many messages are
                                    // deprecated afterwards update start_index

                                    let mut deprecated_count = 0;

                                    let now = std::time::Instant::now().duration_since(start_time);
                                    let breakpoint = now.saturating_sub(frame_size);
                                    for event in store_lock.history[start_index..].iter() {
                                        if event.timestamp >= breakpoint {
                                            break;
                                        }
                                        deprecated_count += 1;
                                    }
                                    start_index += deprecated_count;

                                    let payload = store_lock.history[latest_index..].to_vec();
                                    latest_index = store_lock.history.len();
                                    // println!("emit {event_name} = [{:?}]", payload.len());
                                    app_handle
                                        .emit_all(
                                            &event_name,
                                            ObjectEntryHistoryEvent {
                                                new_values: payload,
                                                deprecated_count,
                                            },
                                        )
                                        .unwrap();
                                    next_batch_time = tokio::time::Instant::now() + min_interval;
                                    timeout = next_batch_time;
                                } else {
                                    //panic!("I assumed this should not be called, just checking here!");
                                }
                            }
                        }
                        None => {
                            panic!("rx_receiver closed early");
                        }
                    };
                }
                Err(_elapsed) => {
                    let store_lock = store.lock().await;
                    if store_lock.history.len() < latest_index {
                        let mut deprecated_count = 0;

                        let now = std::time::Instant::now().duration_since(start_time);
                        let breakpoint = now.saturating_sub(frame_size);
                        for event in store_lock.history[start_index..].iter() {
                            if event.timestamp >= breakpoint {
                                break;
                            }
                            deprecated_count += 1;
                        }
                        start_index += deprecated_count;

                        let payload = store_lock.history[latest_index..].to_vec();
                        // println!("emit {event_name} = [{:?}]", payload.len());
                        latest_index = store_lock.history.len();
                        app_handle
                            .emit_all(
                                &event_name,
                                ObjectEntryHistoryEvent {
                                    new_values: payload,
                                    deprecated_count: 0,
                                },
                            )
                            .unwrap();
                        next_batch_time = tokio::time::Instant::now() + min_interval;
                    }
                    timeout += Duration::from_secs(0xFFFF); //wait for ever!
                }
            }
        }
        println!("stop notify task for {event_name}");
    }
}
