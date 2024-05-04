use std::{
    sync::{atomic::AtomicU64, Arc},
    time::{Duration, Instant},
};

use canzero_config::config;
use chrono;
use tokio::sync::Mutex;

use crate::{
    cnl::{
        self, frame::Value, network::object_entry_object::database::ObjectEntryDatabase, tx::TxCom,
    },
    notification::{notify_error, notify_info, notify_warning},
};

use self::{
    database::value::ObjectEntryValue,
    history::ObjectEntryHistroyObservable,
    info::{ty::ObjectEntryType, ObjectEntryInformation},
    latest::{event::OwnedObjectEntryEvent, ObjectEntryLatestObservable},
};

mod database;
pub mod history;
pub mod info;
pub mod latest;

pub struct ObjectEntryObject {
    object_entry_ref: config::ObjectEntryRef,
    store: Arc<Mutex<ObjectEntryDatabase>>,
    timebase: std::time::Instant,
    latest_observable: ObjectEntryLatestObservable,
    latest_event_name: String,
    history_observables: Mutex<Vec<ObjectEntryHistroyObservable>>,
    history_observables_id_acc: AtomicU64,
    history_event_name_prefix: String,
    app_handle: tauri::AppHandle,
    tx_com: Arc<TxCom>,
    open_set_request: Arc<Mutex<u64>>,
    open_get_request: Arc<Mutex<u64>>,
    set_request_timeout: Duration,
    get_request_timeout: Duration,
    plottable: bool,
}

impl ObjectEntryObject {
    pub fn create(
        _network_config: &config::NetworkRef,
        node_config: &config::NodeRef,
        object_entry_config: &config::ObjectEntryRef,
        app_handle: &tauri::AppHandle,
        tx_com: Arc<TxCom>,
        timebase: Instant,
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
        let get_req_num_frames = object_entry_config.ty().size().div_ceil(32) as u64;

        let plottable = node_config.tx_streams().iter().any(|stream| {
            stream
                .mapping()
                .iter()
                .flatten()
                .any(|o| o.id() == object_entry_config.id())
        });

        Self {
            object_entry_ref: object_entry_config.clone(),
            store: Arc::new(Mutex::new(ObjectEntryDatabase::new())),
            timebase,
            latest_observable: ObjectEntryLatestObservable::new(
                &latest_event_name,
                Duration::from_millis(100),
                &app_handle,
            ),
            latest_event_name,
            history_observables: Mutex::new(vec![]),
            history_observables_id_acc: AtomicU64::new(0),
            history_event_name_prefix: history_event_name,
            app_handle: app_handle.clone(),
            tx_com,
            open_set_request: Arc::new(Mutex::new(0)),
            open_get_request: Arc::new(Mutex::new(0)),
            set_request_timeout: Duration::from_millis(100),
            get_request_timeout: Duration::from_millis(100 + get_req_num_frames * 50),
            plottable,
        }
    }
    pub fn name(&self) -> &str {
        self.object_entry_ref.name()
    }
    pub fn id(&self) -> u32 {
        self.object_entry_ref.id()
    }
    pub fn latest_event_name(&self) -> &str {
        &self.latest_event_name
    }
    pub fn node_id(&self) -> u8 {
        self.object_entry_ref.node().id() as u8
    }

    pub async fn request_current_value(&self) {
        let mut get_req_num = match self.open_get_request.try_lock() {
            Ok(n) => {
                if *n % 2 == 0 {
                    n
                } else {
                    notify_warning(
                        &self.app_handle,
                        "other get request still in progress -- ignoring",
                        "An older set request is still waiting for a response. Ignoring current request.",
                        chrono::Local::now(),
                    );
                    return;
                }
            }
            Err(_) => {
                notify_warning(
                    &self.app_handle,
                    "other get request still open -- ignoring",
                    "An older set request is still in progess. Ignoring current request.",
                    chrono::Local::now(),
                );
                return;
            }
        };
        *get_req_num += 1;
        let my_req_num = *get_req_num;
        drop(get_req_num);
        self.tx_com
            .send_get_req(self.node_id(), self.id() as u16)
            .await;
        tokio::spawn({
            let timeout = self.get_request_timeout.clone();
            let id = self.id();
            let node_id = self.node_id();
            let get_requests = self.open_get_request.clone();
            let app_handle = self.app_handle.clone();

            async move {
                tokio::time::sleep(timeout).await;
                let mut new_req_num = get_requests.lock().await;
                if *new_req_num == my_req_num {
                    *new_req_num += 1;
                    notify_error(
                        &app_handle,
                        "get request timed out",
                        &format!(
                            "Get request for object entry with id {id} of node {node_id} timed out",
                        ),
                        chrono::Local::now(),
                    );
                }
            }
        });
    }

    pub async fn set_request(&self, value: Value) {
        let mut set_req_num = match self.open_set_request.try_lock() {
            Ok(n) => {
                if *n % 2 == 0 {
                    n
                } else {
                    notify_warning(
                        &self.app_handle,
                        "other set request still open -- ignoring",
                        "Older set request is still waiting for a response -- ignoring",
                        chrono::Local::now(),
                    );
                    return;
                }
            }
            Err(_) => {
                notify_warning(
                    &self.app_handle,
                    "other set request still open -- ignoring",
                    "Older set request still in progress -- ignoring",
                    chrono::Local::now(),
                );
                return;
            }
        };
        *set_req_num += 1;
        let my_req_num = *set_req_num;
        drop(set_req_num);

        let (bit_value, last_fill) = value.get_as_bin(self.ty());
        let server_id = self.node_id();
        let oe_id = self.id();
        self.tx()
            .send_set_request(server_id, oe_id, bit_value, last_fill)
            .await;

        tokio::task::spawn({
            let timeout = self.set_request_timeout.clone();
            let id = self.id();
            let node_id = self.node_id();
            let app_handle = self.app_handle.clone();
            let set_requests = self.open_set_request.clone();

            async move {
                tokio::time::sleep(timeout).await;
                let mut new_req_num = set_requests.lock().await;
                if *new_req_num == my_req_num {
                    *new_req_num += 1;
                    notify_error(
                        &app_handle,
                        "set request timed out",
                        &format!(
                            "Set request for object entry with id {id} of node {node_id} timed out",
                        ),
                        chrono::Local::now(),
                    );
                }
            }
        });
    }

    pub async fn push_value(&self, value: Value, timestamp: &Duration) {
        let mut store = self.store.lock().await;
        let delta_time = match store.latest_value() {
            Some(latest) => timestamp.saturating_sub(latest.timestamp), //Not sure if saturating
            //sub is correct here
            None => timestamp.clone(),
        };

        // The value has to be stored before notify because the observables
        // use the values in the store directly to reduce clones
        store.push_value(ObjectEntryValue::new(value, timestamp.clone(), delta_time));
        drop(store); // <- Gentlemen we got him.
        self.latest_observable.notify().await;
        for history_observable in self.history_observables.lock().await.iter() {
            history_observable.notify().await;
        }
    }

    pub async fn push_get_response(&self, value: Value, timestamp: &Duration) {
        let mut get_req_num = self.open_get_request.lock().await;
        if *get_req_num % 2 == 0 {
            notify_warning(
                &self.app_handle,
                "get response came in after timeout",
                "Response to get request came in after timeout -- ignoring",
                chrono::Local::now(),
            );
            return;
        }
        self.push_value(value, timestamp).await;
        *get_req_num += 1;
        drop(get_req_num);
        notify_info(
            &self.app_handle,
            "get request returned successfully",
            &format!(
                "The get request for object entry {} of node {} completed successfully",
                self.id(),
                self.node_id()
            ),
            chrono::Local::now(),
        );
    }

    pub async fn push_set_response(&self, result: cnl::errors::Result<()>) {
        let mut set_req_num = self.open_set_request.lock().await;
        if *set_req_num % 2 == 0 {
            notify_info(
                &self.app_handle,
                "set response came in after timeout",
                &format!(
                    "Set response for object entry with id {} of node {} came in after timeout",
                    self.id(),
                    self.node_id()
                ),
                chrono::Local::now(),
            );
            return;
        };
        *set_req_num += 1;
        drop(set_req_num);
        match result {
            Ok(_) => {
                notify_info(
                    &self.app_handle,
                    "set request successfull",
                    &format!(
                        "Object entry with id {} of node {} was set",
                        self.id(),
                        self.node_id()
                    ),
                    chrono::Local::now(),
                );
            }
            Err(err) => {
                notify_error(
                    &self.app_handle,
                    err.reason(),
                    err.description(),
                    chrono::Local::now(),
                );
            }
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
    pub async fn latest_event(&self) -> Option<OwnedObjectEntryEvent> {
        self.store
            .lock()
            .await
            .latest_value()
            .map(ObjectEntryValue::clone)
            .map(OwnedObjectEntryEvent::new)
    }

    pub async fn listen_to_history(
        &self,
        frame_size: Duration,
        min_interval: Duration,
    ) -> (String, Vec<OwnedObjectEntryEvent>) {
        let store_lock = self.store.lock().await;
        let history = store_lock.history();
        let now = std::time::Instant::now().duration_since(self.timebase);
        let breakpoint = now.saturating_sub(frame_size);
        let mut breakpoint_index = None;
        for (i, event) in history.iter().enumerate().rev() {
            if event.timestamp <= breakpoint {
                breakpoint_index = Some(i);
                break;
            }
        }
        let start_index = breakpoint_index.unwrap_or(0);
        let history_of = history[start_index..]
            .iter()
            .map(ObjectEntryValue::clone)
            .map(OwnedObjectEntryEvent::new)
            .collect();
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
            self.timebase,
        );
        new_history_observable.start_notify_task(&self.store).await;
        self.history_observables
            .lock()
            .await
            .push(new_history_observable);

        (event_name, history_of)
    }

    pub async fn complete_history(&self) -> Vec<OwnedObjectEntryEvent> {
        let store_lock = self.store.lock().await;
        let history = store_lock.history();
        history
            .iter()
            .map(ObjectEntryValue::clone)
            .map(OwnedObjectEntryEvent::new)
            .collect()
    }

    pub async fn unlisten_from_history(&self, event_name: &str) {
        let mut history_observables = self.history_observables.lock().await;
        let mut remove = None;
        for (i, observable) in history_observables.iter_mut().enumerate() {
            if observable.event_name() == event_name {
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

    pub fn information(&self) -> ObjectEntryInformation {
        ObjectEntryInformation::new(
            self.object_entry_ref.name().to_owned(),
            self.object_entry_ref.description().map(str::to_owned),
            self.object_entry_ref.id() as u16,
            self.object_entry_ref.unit().map(str::to_owned),
            ObjectEntryType::new(self.object_entry_ref.ty()),
            self.plottable
        )
    }

    pub fn now(&self) -> Duration {
        std::time::Instant::now().duration_since(self.timebase)
    }
}
