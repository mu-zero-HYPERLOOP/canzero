use std::{
    sync::{
        atomic::{AtomicBool, AtomicU64},
        Arc,
    },
    time::Duration,
};

use can_config_rs::config;
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
    start_time: std::time::Instant,
    latest_observable: ObjectEntryLatestObservable,
    latest_event_name: String,
    history_observables: Mutex<Vec<ObjectEntryHistroyObservable>>,
    history_observables_id_acc: AtomicU64,
    history_event_name_prefix: String,
    app_handle: tauri::AppHandle,
    tx_com: Arc<TxCom>,
    open_set_request: AtomicBool,
    set_request_num: AtomicU64,
    set_request_timeout: Duration,
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
            store: Arc::new(Mutex::new(ObjectEntryDatabase::new())),
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
            tx_com,
            open_set_request: AtomicBool::new(false),
            set_request_num: AtomicU64::new(0),
            set_request_timeout: Duration::from_millis(100),
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
        self.tx_com
            .send_get_req(self.node_id(), self.id() as u16)
            .await;
    }

    pub async fn push_value(&self, value: Value, arrive_instance: &std::time::Instant) {
        let mut store = self.store.lock().await;
        let timestamp = arrive_instance.duration_since(self.start_time);
        let delta_time = match store.latest_value() {
            Some(latest) => timestamp.saturating_sub(latest.timestamp), //Not sure if saturating
            //sub is correct here
            None => timestamp,
        };

        // The value has to be stored before notify because the observables
        // use the values in the store directly to reduce clones
        store.push_value(ObjectEntryValue::new(value, timestamp, delta_time));
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

    pub fn push_set_response(&self, result: cnl::errors::Result<()>) {
        if !self
            .open_set_request
            .swap(false, std::sync::atomic::Ordering::SeqCst)
        {
            notify_info(
                &self.app_handle,
                "set response came in after timeout",
                &format!(
                    "The set response for object entry with id {} of node {} came in too late",
                    self.id(),
                    self.node_id()
                ),
                chrono::Local::now(),
            );
            return;
        };

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
                notify_error(&self.app_handle, err.reason(), err.description(), chrono::Local::now());
            }
        }
    }
    pub async fn set_request(&self, value: Value) {
        if self
            .open_set_request
            .fetch_or(true, std::sync::atomic::Ordering::SeqCst)
        {
            notify_warning(
                &self.app_handle,
                "other set request still open -- ignoring",
                "An older set request for the same object entry is still in progress.
                 Thus this set request is ignored",
                 chrono::Local::now(),
            );
            return;
        }
        self.set_request_num
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        let (bit_value, last_fill) = value.get_as_bin(self.ty());
        let server_id = self.node_id();
        let oe_id = self.id();

        self.tx()
            .send_set_request(server_id, oe_id, bit_value, last_fill)
            .await;
        let my_set_req_num = self
            .set_request_num
            .load(std::sync::atomic::Ordering::SeqCst);
        tokio::time::sleep(self.set_request_timeout).await;
        if self
            .open_set_request
            .load(std::sync::atomic::Ordering::SeqCst)
        {
            if self
                .set_request_num
                .load(std::sync::atomic::Ordering::SeqCst)
                == my_set_req_num
            {
                self.open_set_request
                    .store(false, std::sync::atomic::Ordering::SeqCst);
                notify_error(
                    &self.app_handle,
                    "set request timed out",
                    &format!(
                        "Set request for object entry with id {} of node {} timed out",
                        self.id(),
                        self.node_id()
                    ),
                    chrono::Local::now(),
                );
            }
        }
    }

    pub fn information(&self) -> ObjectEntryInformation {
        ObjectEntryInformation::new(
            self.object_entry_ref.name().to_owned(),
            self.object_entry_ref.description().map(str::to_owned),
            self.object_entry_ref.id() as u16,
            self.object_entry_ref.unit().map(str::to_owned),
            ObjectEntryType::new(self.object_entry_ref.ty()),
        )
    }
}
