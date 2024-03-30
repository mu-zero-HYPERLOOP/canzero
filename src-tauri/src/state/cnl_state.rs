use std::ops::Deref;

use can_config_rs::config::NetworkRef;
use tokio::sync::Mutex;

use crate::cnl::{can_adapter::CanAdapter, CNL};

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
    pub async fn create(network_config: NetworkRef, app_handle: &tauri::AppHandle, can_adapters : Vec<CanAdapter>) -> Self {
        Self {
            cnl: Mutex::new(CNL::create(&network_config, app_handle, can_adapters).await),
        }
    }
}
