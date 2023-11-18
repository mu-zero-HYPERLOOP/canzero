use std::sync::{atomic::AtomicUsize, Mutex};

use tauri::Manager;


// gets send after requesting
#[derive(serde::Serialize)]
pub struct StreamObjectListener {
    event_name: String,
}

//gets send on a event
#[derive(serde::Serialize)]
pub struct StreamObjectEvent<U>
where
    U: serde::Serialize,
{
    value: U,
}

#[derive(serde::Serialize)]
pub struct StreamObjectStore<T>
where
    T: serde::Serialize + Clone,
{
    value: Vec<T>,
}

pub struct StreamObject<T>
where
    T: serde::Serialize + Clone,
{
    event_name: String,
    store: Mutex<StreamObjectStore<T>>,
    ref_count: Mutex<usize>,
}

impl<T: serde::Serialize + Clone> StreamObject<T> {
    pub fn new(name: &str, inital_value: Vec<T>) -> Self {
        Self {
            event_name: name.to_owned(),
            store: Mutex::new(StreamObjectStore {
                value: inital_value,
            }),
            ref_count: Mutex::new(0),
        }
    }

    pub fn listen(&self) -> Vec<T>{
        *self.ref_count.lock().expect("failed to acquire stream object lock") += 1;
        self.store.lock().expect("failed to acquire stream object lock").value.clone()
    }

    pub fn unlisten(&self) {
        let v = *self.ref_count.lock().expect("failed to acquire stream object lock");
        let v = v.saturating_sub(1);
        *self.ref_count.lock().expect("failed to acquire stream object lock") = v;
    }

    pub fn push_value(&self, app_handle : &tauri::AppHandle, value: T) {
        self.store
            .lock()
            .expect("failed to acquire stream object lock")
            .value
            .push(value.clone());
        app_handle.emit_all(&self.event_name, value).expect("failed to transmit stream object event");
    }
}


pub trait GenericStreamObject {
}
