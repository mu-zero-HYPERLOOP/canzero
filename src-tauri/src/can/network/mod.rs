use can_config_rs::config;

use self::node_object::NodeObject;

pub mod command_object;
pub mod node_object;
pub mod object_entry_object;

pub struct NetworkObject {
    nodes: Vec<NodeObject>,
    network_ref: config::NetworkRef,
}

impl NetworkObject {
    pub fn create(network_config: &config::NetworkRef) -> Self {
        Self {
            nodes: network_config
                .nodes()
                .iter()
                .map(|node_config| NodeObject::create(node_config))
                .collect(),
            network_ref: network_config.clone(),
        }
    }
    pub fn baudrate(&self) -> u32 {
        self.network_ref.baudrate()
    }
    pub fn nodes(&self) -> &Vec<NodeObject> {
        &self.nodes
    }
}
