use std::{sync::Arc, time::Instant};

use canzero_config::config;

use crate::cnl::tx::TxCom;

use self::latest::NodeLatestObservable;

use super::{command_object::CommandObject, object_entry_object::ObjectEntryObject};

pub mod latest;

pub struct NodeObject {
    node_ref: config::NodeRef,
    object_entries: Vec<Arc<ObjectEntryObject>>,
    commands: Vec<Arc<CommandObject>>,
    latest_observable: NodeLatestObservable,
}

impl NodeObject {
    pub fn create(
        network_config : &config::NetworkRef,
        node_config: &config::NodeRef,
        app_handle: &tauri::AppHandle,
        tx_com: Arc<TxCom>,
        timebase : Instant,
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
                    timebase
                ))
            })
            .collect();
        let node_name = node_config.name();
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
}
