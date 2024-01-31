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
        let test_config_path = app_handle.path_resolver().resolve_resource(config_path).expect("failed to resolve resource test.yaml");
        let network_config = can_yaml_config_rs::parse_yaml_config_from_file(
            test_config_path.to_str().expect("config path is not a valid unicode string")).unwrap();
        let cnl = CNL::create(&network_config, app_handle);
        Self {
            cnl: Mutex::new(cnl),
        }
    }
}
