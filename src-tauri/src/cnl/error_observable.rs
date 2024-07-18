use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc, Mutex,
};

use canzero_config::config::Type;
use color_print::cprintln;
use serde::Serialize;
use tauri::Manager;
use tokio::time::{self, Duration, Instant};

use super::network::{
    object_entry_object::{database::value::ObjectEntryValue, vlistener::ObjectEntryListener},
    NetworkObject,
};

#[derive(Serialize, Clone, Debug)]
struct Friend {
    node_name : String,
    object_entry_name : String,
}

#[derive(Serialize, Clone, Debug)]
pub struct ErrorEvent {
    level: ErrorLevel,
    deprecated: bool,
    label: String,
    description: Option<String>,
    friend: Option<Friend>,
    timestamp : String,
}

#[derive(PartialEq, Clone, Copy, PartialOrd, Serialize, Debug)]
enum ErrorLevel {
    OK,
    INFO,
    WARNING,
    ERROR,
}

enum ErrorTaskMsg {
    NewValue,
    StopTask,
}

pub struct ErrorState {
    label: String,
    pub level: Mutex<ErrorLevel>,
    last_level_update_timestamp : Mutex<Duration>,
    max_level: Mutex<ErrorLevel>,
    last_max_level_update_timestamp : Mutex<Duration>,
    description: Option<String>,
    tx: tokio::sync::mpsc::Sender<ErrorTaskMsg>,
    friend: Option<Friend>,
}

impl ObjectEntryListener for ErrorState {
    fn notify(&self, value: &ObjectEntryValue) {
        let current_level: ErrorLevel = match &value.value {
            super::frame::Value::EnumValue(level_str) => {
                if level_str == "OK" {
                    ErrorLevel::OK
                } else if level_str == "INFO" {
                    ErrorLevel::INFO
                } else if level_str == "WARNING" {
                    ErrorLevel::WARNING
                } else if level_str == "ERROR" {
                    ErrorLevel::ERROR
                } else {
                    cprintln!("<red>Invalid error type value (Not a valid variant)</red>");
                    ErrorLevel::ERROR
                }
            }
            _ => {
                cprintln!("<red>Invalid error type value (Not a enum)</red>");
                ErrorLevel::ERROR
            }
        };
        let mut level_lck = self
            .level
            .lock()
            .expect("Failed to acquire error state lock");
        let prev_level = *level_lck;
        if prev_level != current_level {
            *level_lck = current_level;
            *self.last_level_update_timestamp.lock().unwrap() = value.timestamp;
            let mut max_level_lck = self
                .max_level
                .lock()
                .expect("Failed to acquire max error level mutex");
            if current_level >= *max_level_lck {
                *max_level_lck = current_level;
                *self.last_max_level_update_timestamp.lock().unwrap() = value.timestamp;
            }
            let tx = self.tx.clone();
            tokio::spawn(async move {
                tx.send(ErrorTaskMsg::NewValue)
                    .await
                    .expect("Failed to notify error observable task")
            });
        }
    }
}

pub struct ErrorObservable {
    rx: Arc<tokio::sync::Mutex<tokio::sync::mpsc::Receiver<ErrorTaskMsg>>>,
    tx: tokio::sync::mpsc::Sender<ErrorTaskMsg>,
    listen_count: AtomicUsize,
    states: Arc<Vec<Arc<ErrorState>>>,
    app_handle: tauri::AppHandle,
}

impl ErrorObservable {
    pub async fn new(app_handle: &tauri::AppHandle, network_object: &NetworkObject) -> Self {
        let mut error_oes = vec![];
        for node in network_object.nodes() {
            for oe in node.object_entries() {
                match oe.ty() as &Type {
                    canzero_config::config::Type::Enum {
                        name,
                        description: _,
                        size: _,
                        entries: _,
                        visibility: _,
                    } => {
                        if name == "error_flag" || name == "error_level" {
                            error_oes.push(oe.clone());
                        }
                    }
                    _ => continue,
                }
            }
        }
        let (tx, rx) = tokio::sync::mpsc::channel::<ErrorTaskMsg>(16);
        let mut states = vec![];
        for error_oe in error_oes {
            let friend = error_oe.friend().map(|oeo| Friend {
                node_name: oeo.node().name().to_owned(),
                object_entry_name: oeo.name().to_owned(),
            });

            let state = Arc::new(ErrorState {
                label: format!("{}::{}", error_oe.node_ref().name(), error_oe.name()),
                level: Mutex::new(ErrorLevel::OK),
                last_level_update_timestamp : Mutex::new(Duration::ZERO),
                max_level: Mutex::new(ErrorLevel::OK),
                last_max_level_update_timestamp : Mutex::new(Duration::ZERO),
                description: error_oe.information().description().map(str::to_owned),
                tx: tx.clone(),
                friend,
            });
            error_oe.vlisten(state.clone()).await;
            states.push(state);
        }

        Self {
            rx: Arc::new(tokio::sync::Mutex::new(rx)),
            tx,
            listen_count: AtomicUsize::new(0),
            states: Arc::new(states),
            app_handle: app_handle.clone(),
        }
    }

    pub async fn reset(&self) {
        for s in self.states.iter() {
            *s.level.lock().unwrap() = ErrorLevel::OK;
            *s.max_level.lock().unwrap() = ErrorLevel::OK;
        }
    }

    pub async fn current(&self) -> Vec<ErrorEvent> {
        Self::sort_states(&self.states)
    }

    pub async fn listen(&self) {
        let prev_listen_count = self.listen_count.fetch_add(1, Ordering::SeqCst);
        if prev_listen_count == 0 {
            // task notify task!
            tokio::spawn(Self::notify_task(
                self.rx.clone(),
                self.states.clone(),
                self.app_handle.clone(),
            ));
        }
    }

    pub async fn unlisten(&self) {
        let prev_listen_count = self.listen_count.fetch_sub(1, Ordering::SeqCst);
        if prev_listen_count == 0 {
            self.listen_count.store(0, Ordering::SeqCst);
            cprintln!("<red>Trying to unlisten from the error observable, but the observable is not active</red>");
            return;
        } else {
            // stop notify task!
            self.tx
                .send(ErrorTaskMsg::StopTask)
                .await
                .expect("Failed to send stop message to the error observable task");
        }
    }

    async fn notify_task(
        rx: Arc<tokio::sync::Mutex<tokio::sync::mpsc::Receiver<ErrorTaskMsg>>>,
        states: Arc<Vec<Arc<ErrorState>>>,
        app_handle: tauri::AppHandle,
    ) {
        let mut rx = rx.lock().await;
        const MIN_INTERVAL: Duration = Duration::from_millis(50);
        let mut timeout = Instant::now();
        let mut next_batch_time = timeout;
        loop {
            match time::timeout_at(timeout, rx.recv()).await {
                Ok(opt_msg) => match opt_msg {
                    Some(msg) => match msg {
                        ErrorTaskMsg::NewValue => {
                            if next_batch_time <= Instant::now() {
                                Self::sort_and_notify_frontend(&states, &app_handle);
                            }

                            next_batch_time = Instant::now() + MIN_INTERVAL;
                            timeout = next_batch_time;
                        }
                        ErrorTaskMsg::StopTask => break,
                    },
                    None => {
                        cprintln!(
                            "<red>Error notify task rx failed. Tx channel closed early</red>"
                        );
                        break;
                    }
                },
                Err(_elapsed) => {
                    Self::sort_and_notify_frontend(&states, &app_handle);

                    next_batch_time = Instant::now() + MIN_INTERVAL;
                    timeout = Instant::now() + Duration::from_secs(0xFFFF);
                }
            };
        }
    }

    fn sort_states(states: &Arc<Vec<Arc<ErrorState>>>) -> Vec<ErrorEvent> {
        // filter states
        let mut events: Vec<ErrorEvent> = vec![];
        for state in states.iter() {
            let level = *state
                .level
                .lock()
                .expect("Failed to acquire error state lock (error_level)");
            let max_level = *state
                .max_level
                .lock()
                .expect("Failed to acquire error state lock (max_level)");
            if level != ErrorLevel::OK {
                events.push(ErrorEvent {
                    level,
                    timestamp : format!("{}s", state.last_level_update_timestamp.lock().unwrap().as_secs()),
                    deprecated: false,
                    label: state.label.clone(),
                    friend : state.friend.clone(),
                    description: state.description.clone(),
                });
            }
            if level < max_level {
                events.push(ErrorEvent {
                    level: max_level,
                    timestamp : format!("{}s", state.last_max_level_update_timestamp.lock().unwrap().as_secs()),
                    deprecated: true,
                    label: state.label.clone(),
                    friend : state.friend.clone(),
                    description: state.description.clone(),
                });
            }
        }

        events.sort_by(|a, b| {
            if a.deprecated == b.deprecated {
                if a.level == b.level {
                    a.label.cmp(&b.label)
                } else if a.level > b.level {
                    std::cmp::Ordering::Less
                } else {
                    std::cmp::Ordering::Greater
                }
            } else if a.deprecated && !b.deprecated {
                std::cmp::Ordering::Greater
            } else {
                std::cmp::Ordering::Less
            }
        });
        events
    }

    fn sort_and_notify_frontend(
        states: &Arc<Vec<Arc<ErrorState>>>,
        app_handle: &tauri::AppHandle,
    ) {
        let events = Self::sort_states(states);
        app_handle
            .emit_all("canzero_errors", events)
            .expect("Failed to emit event 'canzero_errors'");
    }
}
