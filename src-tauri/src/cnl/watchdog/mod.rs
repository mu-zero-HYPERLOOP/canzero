use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use color_print::cprintln;
use tokio::{sync::mpsc, task::AbortHandle, time::Instant};

struct WatchdogSignal;

pub struct WatchdogTimeout {
    pub name: String,
    pub error: WatchdogError,
}

#[derive(Debug, Clone)]
pub enum WatchdogError {
    Timeout,
    PosionError, // channel dropped early
}

struct WatchdogInner {
    abort_handle: AbortHandle,
    reset_tx: mpsc::Sender<WatchdogSignal>,
    overlord: Arc<WatchdogOverlordInner>,
    name: String,
}

pub struct Watchdog(Arc<WatchdogInner>);

impl Watchdog {
    pub fn create(
        watchdog_name: String,
        timeout: Duration,
        overlord: Arc<WatchdogOverlordInner>,
    ) -> Self {
        let (reset_tx, reset_rx) = mpsc::channel(16);

        let abort_handle = tokio::spawn(Self::watchdog_task(
            reset_rx,
            timeout,
            overlord.clone(),
            watchdog_name.clone(),
        ))
        .abort_handle();

        Watchdog(Arc::new(WatchdogInner {
            abort_handle,
            reset_tx,
            overlord,
            name: watchdog_name,
        }))
    }

    async fn watchdog_task(
        mut reset_rx: mpsc::Receiver<WatchdogSignal>,
        timeout: Duration,
        overlord: Arc<WatchdogOverlordInner>,
        watchdog_name: String,
    ) {
        let sleep = tokio::time::sleep(timeout);
        tokio::pin!(sleep);
        loop {
            tokio::select! {
                msg = reset_rx.recv() => {
                    match msg {
                        Some(_) => {
                            sleep.as_mut().reset(Instant::now() + timeout)
                        }
                        None => break,
                    }
                },
                () = sleep.as_mut() => {
                    overlord.notify_timeout(WatchdogTimeout {
                        name : watchdog_name.clone(),
                        error : WatchdogError::Timeout,
                    });
                    sleep.as_mut().reset(Instant::now() + timeout)
                },
            }
        }
    }

    pub async fn reset(&self) {
        if let Err(_) = self.0.reset_tx.send(WatchdogSignal).await {
            self.0.overlord.notify_timeout(WatchdogTimeout {
                name: self.0.name.clone(),
                error: WatchdogError::PosionError,
            });
        }
    }
}

impl Drop for Watchdog {
    fn drop(&mut self) {
        self.0.abort_handle.abort();
    }
}

struct WatchdogOverlordInner {
    watchdogs: Mutex<Vec<Watchdog>>,
}

impl WatchdogOverlordInner {
    fn notify_timeout(&self, timeout: WatchdogTimeout) {
        cprintln!("<red> Watchdog {} timeout", timeout.name);
    }
}

pub struct WatchdogOverlord(Arc<WatchdogOverlordInner>);

impl WatchdogOverlord {
    pub fn new() -> Self {
        Self(Arc::new(WatchdogOverlordInner {
            watchdogs: Mutex::new(vec![]),
        }))
    }

    pub fn register(&self, name: String, timeout: Duration) -> Watchdog {
        let watchdog = Watchdog::create(name, timeout, self.0.clone());
        self.0
            .watchdogs
            .lock()
            .expect("Failed to acquire WatchdogOverloard lock")
            .push(Watchdog(watchdog.0.clone()));
        watchdog
    }

    pub fn unregister(&self, watchdog: Watchdog) {
        let mut watchdog_lock = self.0.watchdogs.lock().expect("Failed to acquire WatchdogOverloard lock");;
        let Some(pos) = watchdog_lock.iter().position(|w| w.0.name == watchdog.0.name) else {
            cprintln!("<yellow>Trying to unregister non registered watchdog</yellow>");
            return;
        };
        watchdog_lock.remove(pos);
        // afterwards the watchdog is destructured because the local ref 
        // is gone and the ref in the vec. It's fair to assume that these two are the only once
        // because clone is not exposed.
        // note: destructing the watchdog also aborts it's watchdog task!
    }
}
