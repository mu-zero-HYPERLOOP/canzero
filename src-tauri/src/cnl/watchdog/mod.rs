use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use color_print::cprintln;
use tokio::{sync::mpsc, task::AbortHandle, time::Instant};

use crate::cnl::connection::ConnectionStatus;

use super::connection::ConnectionObject;

struct WatchdogSignal {
    unregister: bool
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum WdgTag {
    FrontendWdg,
    DeadlockWdg,
    Heartbeat { node_id: u8, bus_id: u32 },
}

pub struct WatchdogTimeout {
    pub tag: WdgTag,
    pub error: WatchdogError,
}

#[derive(Debug, Clone)]
pub enum WatchdogError {
    Timeout,
    PoisonError, // channel dropped early
}

struct WatchdogInner {
    abort_handle: AbortHandle,
    reset_tx: mpsc::Sender<WatchdogSignal>,
    overlord: Arc<WatchdogOverlordInner>,
    tag: WdgTag,
}

pub struct Watchdog(Arc<WatchdogInner>);

impl Watchdog {
    fn create(tag: WdgTag, timeout: Duration, overlord: Arc<WatchdogOverlordInner>) -> Self {
        let (reset_tx, reset_rx) = mpsc::channel(16);

        let abort_handle = tokio::spawn(Self::watchdog_task(
            reset_rx,
            timeout,
            overlord.clone(),
            tag,
        ))
        .abort_handle();

        Watchdog(Arc::new(WatchdogInner {
            abort_handle,
            reset_tx,
            overlord,
            tag,
        }))
    }

    pub fn tag(&self) -> &WdgTag {
        &self.0.tag
    }

    async fn watchdog_task(
        mut reset_rx: mpsc::Receiver<WatchdogSignal>,
        timeout: Duration,
        overlord: Arc<WatchdogOverlordInner>,
        wdg_tag: WdgTag,
    ) {
        let sleep = tokio::time::sleep(timeout);
        tokio::pin!(sleep);
        let mut active = false;
        loop {
            tokio::select! {
                Some(WatchdogSignal{unregister}) = reset_rx.recv() => {
                    active = !unregister;
                    sleep.as_mut().reset(Instant::now() + timeout)
                },
                () = sleep.as_mut(), if active => {
                    overlord.notify_timeout(WatchdogTimeout {
                        tag : wdg_tag,
                        error : WatchdogError::Timeout,
                    });
                    sleep.as_mut().reset(Instant::now() + timeout)
                },
            }
        }
    }

    pub async fn reset(&self, unregister: bool) {
        if let Err(_) = self.0.reset_tx.send(WatchdogSignal{unregister}).await {
            self.0.overlord.notify_timeout(WatchdogTimeout {
                tag: self.0.tag,
                error: WatchdogError::PoisonError,
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
    connection_object: Arc<ConnectionObject>,
}

impl WatchdogOverlordInner {
    fn notify_timeout(&self, timeout: WatchdogTimeout) {
        cprintln!("<red> Watchdog {:?} timeout</red>", timeout.tag);
        match timeout.tag {
            WdgTag::FrontendWdg => self
                .connection_object
                .set_status(ConnectionStatus::FrontendWdgTimeout),
            WdgTag::DeadlockWdg => self
                .connection_object
                .set_status(ConnectionStatus::DeadlockWdgTimeout),
            WdgTag::Heartbeat { node_id, bus_id } => self
                .connection_object
                .set_status(ConnectionStatus::HeartbeatMiss { node_id, bus_id }),
        }
    }
}

pub struct WatchdogOverlord(Arc<WatchdogOverlordInner>);

impl WatchdogOverlord {
    pub fn new(connection_object: &Arc<ConnectionObject>) -> Self {
        Self(Arc::new(WatchdogOverlordInner {
            watchdogs: Mutex::new(vec![]),
            connection_object: connection_object.clone(),
        }))
    }

    pub fn register(&self, tag: WdgTag, timeout: Duration) -> Watchdog {
        let watchdog = Watchdog::create(tag, timeout, self.0.clone());
        self.0
            .watchdogs
            .lock()
            .expect("Failed to acquire WatchdogOverloard lock")
            .push(Watchdog(watchdog.0.clone()));
        watchdog
    }

    // pub fn unregister(&self, watchdog: Watchdog) {
    //     let mut watchdog_lock = self.0.watchdogs.lock().expect("Failed to acquire WatchdogOverloard lock");
    //     let Some(pos) = watchdog_lock.iter().position(|w| w.0.tag == watchdog.0.tag) else {
    //         cprintln!("<yellow>Trying to unregister non registered watchdog</yellow>");
    //         return;
    //     };
    //     watchdog_lock.remove(pos);
    //     // afterwards the watchdog is destructured because the local ref
    //     // is gone and the ref in the vec. It's fair to assume that these two are the only once
    //     // because clone is not exposed.
    //     // note: destructing the watchdog also aborts it's watchdog task!
    // }
}
