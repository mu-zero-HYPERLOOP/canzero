use std::{
    sync::Arc,
    time::{Duration, Instant},
};

use canzero_config::config;

use crate::{
    cnl::{
        tx::TxCom,
        watchdog::{Watchdog, WatchdogOverlord, WdgTag},
    },
    notification::notify_error,
};

use self::latest::NodeLatestObservable;

use super::{command_object::CommandObject, object_entry_object::ObjectEntryObject};

pub mod latest;

pub struct NodeObject {
    node_ref: config::NodeRef,
    object_entries: Vec<Arc<ObjectEntryObject>>,
    commands: Vec<Arc<CommandObject>>,
    latest_observable: NodeLatestObservable,
    heartbeat_wdgs: Vec<Watchdog>,
    app_handle: tauri::AppHandle,
}

impl NodeObject {
    pub fn create(
        network_config: &config::NetworkRef,
        node_config: &config::NodeRef,
        app_handle: &tauri::AppHandle,
        tx_com: Arc<TxCom>,
        timebase: Instant,
        watchdog_overloard: &WatchdogOverlord,
    ) -> Self {
        let object_entries = node_config
            .object_entries()
            .iter()
            .map(|object_entry| {
                Arc::new(ObjectEntryObject::create(
                    network_config,
                    node_config,
                    object_entry,
                    app_handle,
                    tx_com.clone(),
                    timebase,
                ))
            })
            .collect();
        let node_name = node_config.name();
        let mut heartbeat_wdgs = vec![];
        for bus in node_config.buses() {
            heartbeat_wdgs.push(watchdog_overloard.register(
                WdgTag::Heartbeat {
                    node_id: node_config.id(),
                    bus_id: bus.id(),
                },
                Duration::from_millis(200),
            ));
        }
        Self {
            latest_observable: NodeLatestObservable::new(
                &object_entries,
                &format!("{node_name}_latest"),
                app_handle,
            ),
            object_entries,
            commands: node_config
                .commands()
                .iter()
                .map(|command| Arc::new(CommandObject::create(command, app_handle)))
                .collect(),
            node_ref: node_config.clone(),
            heartbeat_wdgs,
            app_handle: app_handle.clone(),
        }
    }
    pub fn id(&self) -> u8 {
        self.node_ref.id()
    }
    pub fn name(&self) -> &str {
        self.node_ref.name()
    }
    pub fn description(&self) -> Option<&String> {
        self.node_ref.description()
    }
    pub fn object_entries(&self) -> &Vec<Arc<ObjectEntryObject>> {
        &self.object_entries
    }
    pub fn commands(&self) -> &Vec<Arc<CommandObject>> {
        &self.commands
    }
    pub async fn listen(&self) -> String {
        self.latest_observable.listen().await
    }
    pub async fn unlisten(&self) {
        self.latest_observable.unlisten().await
    }

    pub async fn deadlock_watchdog(&self) {
        for oe in &self.object_entries {
            oe.deadlock_watchdog().await;
        }
        // for c in &self.commands {
        //     c.deadlock_watchdog().await;
        // }
        // let _ = self.latest_observable.deadlock_watchdog().await;
    }

    pub async fn reset_heartbeat_wdg(&self, bus_id: u32, unregister: bool) {
        if let Some(wdg) = self.heartbeat_wdgs.iter().find(|wdg| {
            wdg.tag() == &WdgTag::Heartbeat {
                    node_id: self.id(),
                    bus_id,
                }
        }) {
            wdg.reset(unregister).await;
            return;
        }
        notify_error(
            &self.app_handle,
            &format!("received heartbeat for node {} on non-existent bus", self.name()),
            &format!("received heartbeat for node {} on non-existent bus", self.name()),
            chrono::Local::now(),
        );
    }
}
