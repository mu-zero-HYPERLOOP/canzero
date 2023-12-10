use std::sync::Arc;

use tauri::Manager;



#[derive(Clone)]
pub enum NotificationLevel {
    Info, 
    Debug,
    Warning,
    Error,
}


impl serde::Serialize for NotificationLevel {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where S: serde::Serializer {
        match &self {
            NotificationLevel::Info => serializer.serialize_str("info"),
            NotificationLevel::Debug => serializer.serialize_str("debug"),
            NotificationLevel::Warning => serializer.serialize_str("warning"),
            NotificationLevel::Error => serializer.serialize_str("error"),
        }
    }
}

#[derive(serde::Serialize, Clone)]
pub struct Notification {
    level : NotificationLevel,
    title : String,
    message : String,
}

impl Notification {
    pub fn make_error(title : &str, msg : &str) -> Notification {
        Notification {
            level : NotificationLevel::Error,
            title : title.to_owned(),
            message : msg.to_owned(),
        }
    }
}

#[derive(Clone)]
pub struct NotificationStream {
    app_handle : Arc<tauri::AppHandle>
}

impl NotificationStream {
    pub fn new(app_handle : &tauri::AppHandle) -> NotificationStream {
        NotificationStream { app_handle: Arc::new(app_handle.clone()) }
    }
    pub fn notify(&self, notification : Notification) {
        self.app_handle.emit_all("notification", notification);
    }

    pub fn notify_error(&self, reason : &str, description : &str) {
        self.app_handle.emit_all("notification", Notification::make_error(reason, description));
    }
}

