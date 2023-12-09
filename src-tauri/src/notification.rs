

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

#[derive(serde::Serialize)]
pub struct Notification {
    level : NotificationLevel,
    message : String,
}
