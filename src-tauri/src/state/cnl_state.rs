use std::ops::Deref;

use tokio::sync::Mutex;

use crate::cnl::CNL;

pub struct CNLState {
    pub cnl: Mutex<CNL>,
}

impl Deref for CNLState {
    type Target = Mutex<CNL>;

    fn deref(&self) -> &Self::Target {
        &self.cnl
    }
}

impl CNLState {
    pub fn create(config_path: &str, app_handle: &tauri::AppHandle) -> Self {
        let network_config = can_yaml_config_rs::parse_yaml_config_from_file(config_path).unwrap();
        let mut cnl = CNL::create(&network_config, app_handle);
        cnl.start();
        Self {
            cnl: Mutex::new(cnl),
        }
    }
}
