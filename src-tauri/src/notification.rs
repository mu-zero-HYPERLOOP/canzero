use std::sync::Arc;

use tauri::Manager;

// TODO remove allow dead_code before release!
#[derive(Clone)]
pub enum NotificationLevel {
    #[allow(dead_code)]
    Info,

    #[allow(dead_code)]
    Debug,

    #[allow(dead_code)]
    Warning,

    Error,
}

impl serde::Serialize for NotificationLevel {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
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
    level: NotificationLevel,
    title: String,
    message: String,
}

impl Notification {
    pub fn make_error(title: &str, msg: &str) -> Notification {
        Notification {
            level: NotificationLevel::Error,
            title: title.to_owned(),
            message: msg.to_owned(),
        }
    }
}

pub fn notify_error(app_handle : &tauri::AppHandle, reason: &str, description: &str) {
    app_handle
        .emit_all(
            "notification",
            Notification::make_error(reason, description),
        )
        .expect("failed to emit notification");
}
