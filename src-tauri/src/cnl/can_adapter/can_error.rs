use serde::{ser::SerializeMap, Serialize};

use super::timestamped::Timestamped;

pub type TCanError = Timestamped<CanError>;

pub struct CanError(pub u64);

impl CanError {
    pub fn erno(&self) -> u64 {
        self.0
    }
}

impl Serialize for CanError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut map = serializer.serialize_map(Some(3))?;

        let bits = self.0;
        map.serialize_entry("data", &bits)?;
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
        map.end()
    }
}
