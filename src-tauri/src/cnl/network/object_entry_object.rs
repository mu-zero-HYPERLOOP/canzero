use can_config_rs::config;

use crate::cnl::frame::type_frame::TypeValue;

pub struct ObjectEntryObject {
    object_entry_ref: config::ObjectEntryRef,
    app_handle: tauri::AppHandle,
}

impl ObjectEntryObject {
    pub fn create(
        object_entry_config: &config::ObjectEntryRef,
        app_handle: &tauri::AppHandle,
    ) -> Self {
        Self {
            object_entry_ref: object_entry_config.clone(),
            app_handle: app_handle.clone(),
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
    pub fn unit(&self) -> Option<&str> {
        self.object_entry_ref.unit()
    }

    pub fn push_value(&self, value: TypeValue) {
        //TODO gets notified when a new value for the object entry is received
        // THIS method can't be mutable (&mut self) we have to use interior
        // mutablity to access fields mutable (common pattern in concurrent rust)
        // we should store the value in some efficient data structure
        // where :
        // it's fast to get the most recent value!
        // it's fast to get all values in order!
        // it's super fast to insert new elements!
        // Issue #9
    }
    pub fn ty(&self) -> &config::TypeRef {
        &self.object_entry_ref.ty()
    }

    // Latest Events Issue #12

    pub fn listen_to_latest(&self) {
        //TODO register a listener from the latest value
    }
    pub fn unlisten_from_latest(&self) {
        //TODO unregister a listener from the latest value
    }
    pub fn latest(&self) {
        //TODO return the latest value received (including last timestamp)
    }

    // History Events Issue #13

    pub fn listen_to_history(&self) {
        //TODO register a listener to the history
    }
    pub fn unlisten_from_history(&self) {
        //TODO unregister a listener of the history
    }
    pub fn history(&self) {
        //TODO return the complete history of values of the ObjectEntry (including timestamp)
    }
}

struct ObjectEntryEvent {
    values: Vec<(usize, TypeValue)>,
}
