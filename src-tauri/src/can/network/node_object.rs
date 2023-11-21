use can_config_rs::config;

use super::{object_entry_object::ObjectEntryObject, command_object::CommandObject};



pub struct NodeObject {
    node_ref : config::NodeRef,
    object_entries : Vec<ObjectEntryObject>,
    commands : Vec<CommandObject>,
}

impl NodeObject{ 
    pub fn create(node_config : &config::NodeRef) -> Self{
        Self {
            object_entries : node_config.object_entries().iter().map(|object_entry| ObjectEntryObject::create(object_entry)).collect(),
            commands : node_config.commands().iter().map(|command| CommandObject::create(command)).collect(),
            node_ref : node_config.clone()
        }
    }
    pub fn name(&self) -> &str {
        self.node_ref.name()
    }
    pub fn description(&self) -> Option<&String> {
        self.node_ref.description()
    }
    pub fn object_entries(&self) -> &Vec<ObjectEntryObject> {
        &self.object_entries
    }
    pub fn commands(&self) -> &Vec<CommandObject> {
        &self.commands
    }

}
