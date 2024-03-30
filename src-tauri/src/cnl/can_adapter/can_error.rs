use std::sync::Arc;

use serde::{ser::SerializeMap, Serialize};

use super::timestamped::Timestamped;

pub type TCanError = Timestamped<CanError>;

#[derive(Debug, Clone)]
pub enum CanError {
    #[allow(unused)]
    Io(Arc<std::io::Error>),
    #[allow(unused)]
    Disconnect(String),
    #[allow(unused)]
    Can(u64),
}

impl CanError {
    pub fn erno(&self) -> u64 {
        match &self {
            CanError::Io(_) => u64::MAX,
            CanError::Disconnect(_) => u64::MAX,
            CanError::Can(can_error) => *can_error,
        }
    }
}

impl Serialize for CanError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut map = serializer.serialize_map(Some(3))?;
        match &self {
            CanError::Io(_) => {
                map.serialize_entry("name", "IoError")?;
                map.serialize_entry(
                    "description",
                    "OsError while using the can adapter",
                )?;
                map.serialize_entry("data", &self.erno())?;
            }
            CanError::Disconnect(reason) => {
                map.serialize_entry("name", "EarlyDisconnect")?;
                map.serialize_entry("description", reason)?;
                map.serialize_entry("data", &self.erno())?;
            }
            CanError::Can(bits) => {
                map.serialize_entry("data", bits)?;
                if bits & 1 != 0 {
                    map.serialize_entry("name", "CAN Bit Error")?;
                    map.serialize_entry("description", "Wtf i didn't send that shit")?;
                } else if bits & 2 != 0 {
                    map.serialize_entry("name", "CAN Bit Stuffing Error")?;
                    map.serialize_entry("description", "Whhyy is everybody sending bullshit!")?;
                } else if bits & 4 != 0 {
                    map.serialize_entry("name", "CAN Form Error")?;
                    map.serialize_entry(
                        "description",
                        "Somebody in this network is to stupid to follow CAN standards!",
                    )?;
                } else if bits & 8 != 0 {
                    map.serialize_entry("name", "CAN ACK Error")?;
                    map.serialize_entry("description", "Wait what CAN has ACK!")?;
                } else if bits & 16 != 0 {
                    map.serialize_entry("name", "CAN CRC Error")?;
                    map.serialize_entry("description", "Some CRC was computed incorrectly!")?;
                } else {
                    map.serialize_entry("name", "Internal Error")?;
                    map.serialize_entry("description", "The CNL fucked up some how!")?;
                }
            }
        }
        map.end()
    }
}
