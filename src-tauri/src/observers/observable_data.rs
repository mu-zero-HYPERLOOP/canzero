use std::{
    sync::{atomic::AtomicUsize, Arc},
    time::Duration,
};

use serde::{Serialize, ser::SerializeSeq};
use tauri::Manager;
use tokio::sync::{mpsc, Mutex};

enum ChannelMsg<T: Serialize + Clone> {
    Value(T),
    Poison,
}

#[derive(Clone)]
struct Batch<T: Serialize + Clone> {
    batch: Vec<T>,
}

impl<T> Serialize for Batch<T> where T : Serialize + Clone {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer {
            let mut seq = serializer.serialize_seq(Some(self.batch.len()))?;
            for value in &self.batch {
                seq.serialize_element(value)?;
            }
            seq.end()
    }
}

impl<T> Batch<T>
where
    T: Serialize + Clone,
{
    fn new() -> Self {
        Self { batch: vec![] }
    }
    fn clear(&mut self) {
        self.batch.clear();
    }
    fn push(&mut self, value: T) {
        self.batch.push(value);
    }
    fn is_empty(&self) -> bool {
        self.batch.is_empty()
    }
    fn size(&self) -> usize {
        self.batch.len()
    }
}

pub struct ObservableData<T: Serialize + Clone + 'static> {
    event_name: String,
    listen_count: AtomicUsize,
    tx: mpsc::Sender<ChannelMsg<T>>,
    rx: Arc<Mutex<mpsc::Receiver<ChannelMsg<T>>>>,
    min_interval: tokio::time::Duration,
    max_batch_size: usize,
    app_handle: tauri::AppHandle,
}

impl<T> ObservableData<T>
where
    T: Serialize + Clone + Send + 'static,
{
    pub fn create(
        app_handle: &tauri::AppHandle,
        event_name: &str,
        min_interval: tokio::time::Duration,
        max_batch_size: usize,
    ) -> Self {
        let (tx, rx) = mpsc::channel(max_batch_size);
        Self {
            event_name: event_name.to_owned(),
            tx,
            rx: Arc::new(Mutex::new(rx)),
            listen_count: AtomicUsize::new(0),
            min_interval,
            max_batch_size,
            app_handle: app_handle.clone(),
        }
    }

    pub async fn notify(&self, value: T) {
        if self.listen_count.load(std::sync::atomic::Ordering::SeqCst) != 0 {
            self.tx.send(ChannelMsg::Value(value)).await.unwrap();
        }
    }

    pub fn notify_batch(&self, batch: Vec<T>) {
        self.app_handle.emit_all(&self.event_name, batch).unwrap();
    }

    pub fn listen(&self) {
        let prev_count = self
            .listen_count
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        if prev_count == 0 {
            // this indicates that the batching task should be started
            self.start_batching_task();
        }
    }

    pub async fn unlisten(&self) {
        let prev_count = self
            .listen_count
            .fetch_sub(1, std::sync::atomic::Ordering::SeqCst);
        if prev_count == 1 {
            // this indicates that the batching task should be stoped
            self.stop_batching_task().await;
        }
    }

    fn start_batching_task(&self) {
        let rx_receiver = self.rx.clone();
        let event_name = self.event_name.clone();
        let app_handle = self.app_handle.clone();
        let mut batch: Batch<T> = Batch::new();
        let min_interval = self.min_interval.clone();
        let max_batch_size = self.max_batch_size;
        tokio::spawn(async move {
            let mut rx = rx_receiver.lock().await;
            let mut next_batch_time = tokio::time::Instant::now();
            let mut timeout = tokio::time::Instant::now() + Duration::from_secs(0xFFFF);

            loop {
                match tokio::time::timeout_at(timeout, rx.recv()).await {
                    Ok(opt) => {
                        match opt {
                            Some(ChannelMsg::Poison) => {
                                if !batch.is_empty() {
                                    println!("emit batch = {:?}", batch.size());
                                    app_handle.emit_all(&event_name, batch.clone()).unwrap();
                                }
                                break;
                            }
                            Some(ChannelMsg::Value(value)) => {
                                batch.push(value);
                                // only send batch if the last interval is min_interval in the past!
                                if next_batch_time <= tokio::time::Instant::now()
                                    || batch.size() >= max_batch_size
                                {
                                    println!("emit batch = {:?}", batch.size());
                                    app_handle.emit_all(&event_name, batch.clone()).unwrap();
                                    batch.clear();
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
                        if !batch.is_empty() {
                            println!("emit batch = {:?}", batch.size());
                            app_handle.emit_all(&event_name, batch.clone()).unwrap();
                            batch.clear();
                            next_batch_time = tokio::time::Instant::now() + min_interval;
                        }
                        timeout += Duration::from_secs(0xFFFF); //wait for ever!
                    }
                }
            }
        });
    }

    async fn stop_batching_task(&self) {
        self.tx.send(ChannelMsg::Poison).await.unwrap();
    }
}
