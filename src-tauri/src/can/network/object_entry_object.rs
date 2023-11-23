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
    pub fn id(&self) -> u32 {
        self.object_entry_ref.id()
    }

    pub fn push_value(&self, value : TypeValue) {
        //TODO gets notified when a new value for the object entry is received
        // THIS method can't be mutable (&mut self) we have to use interior 
        // mutablity to access fields mutable (common pattern in concurrent rust)
    }
    pub fn ty(&self) -> &config::TypeRef {
        &self.object_entry_ref.ty()
    }
}

struct ObjectEntryEvent {
    values : Vec<(usize, TypeValue)>,
}
