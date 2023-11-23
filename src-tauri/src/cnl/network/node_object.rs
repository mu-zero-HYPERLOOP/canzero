use std::sync::Arc;

use can_config_rs::config;

use super::{command_object::CommandObject, object_entry_object::ObjectEntryObject};

pub struct NodeObject {
    node_ref: config::NodeRef,
    object_entries: Vec<Arc<ObjectEntryObject>>,
    commands: Vec<Arc<CommandObject>>,
}

impl NodeObject {
    pub fn create(node_config: &config::NodeRef, app_handle : &tauri::AppHandle) -> Self {
        Self {
            object_entries: node_config
                .object_entries()
                .iter()
                .map(|object_entry| Arc::new(ObjectEntryObject::create(object_entry, app_handle)))
                .collect(),
            commands: node_config
                .commands()
                .iter()
                .map(|command| Arc::new(CommandObject::create(command, app_handle)))
                .collect(),
            node_ref: node_config.clone(),
        }
    }
    pub fn id(&self) -> u16 {
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
}
