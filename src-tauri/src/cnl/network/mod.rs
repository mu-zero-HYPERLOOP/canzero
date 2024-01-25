use std::sync::Arc;

use can_config_rs::config;

use self::node_object::NodeObject;

pub mod command_object;
pub mod node_object;
pub mod object_entry_object;
pub mod set_request;

pub struct NetworkObject {
    nodes: Vec<Arc<NodeObject>>,
    network_ref: config::NetworkRef,
}

impl NetworkObject {
    pub fn create(network_config: &config::NetworkRef, app_handle: &tauri::AppHandle) -> Self {
        Self {
            nodes: network_config
                .nodes()
                .iter()
                .map(|node_config| Arc::new(NodeObject::create(node_config, app_handle)))
                .collect(),
            network_ref: network_config.clone(),
        }
    }
    pub fn nodes(&self) -> &Vec<Arc<NodeObject>> {
        &self.nodes
    }
}
