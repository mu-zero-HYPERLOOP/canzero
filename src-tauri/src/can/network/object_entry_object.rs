use can_config_rs::config;

use crate::can::frame::type_frame::TypeValue;



pub struct ObjectEntryObject {
    object_entry_ref : config::ObjectEntryRef,
}

impl ObjectEntryObject {
    pub fn create(object_entry_config : &config::ObjectEntryRef) -> Self{
        Self {
            object_entry_ref : object_entry_config.clone()
        }
    }
    pub fn name(&self) -> &str {
        self.object_entry_ref.name()
    }
    pub fn description(&self) -> Option<&str> {
        self.object_entry_ref.description()
    }
}

struct ObjectEntryEvent {
    values : Vec<(usize, TypeValue)>,
}
