use serde::{Serialize, ser::SerializeMap};

use crate::can::can_frame::CanError;


/**
 *
 * Serialized into!
 * {
 *     name : string,
 *     description : string,
 *     data : number
 * }
 */


#[derive(Clone, PartialEq, Debug)]
pub struct ErrorFrame {
    data : u64
}

impl ErrorFrame {
    pub fn new(can_error : &CanError) -> Self {
        Self {
            data : match can_error {
                CanError::Io(_) => 0,
                CanError::Disconnect(_) => 0,
                CanError::Can(erno) => *erno,
            }
        }
    }
}

impl Serialize for ErrorFrame {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer {
       let mut map = serializer.serialize_map(Some(1))?;
       map.serialize_entry("data", &self.data)?;
       if self.data & 1 != 0 {
           map.serialize_entry("name", "CAN Bit Error");
           map.serialize_entry("description", "Wtf i didn't send that shit");
       } else if self.data & 2 != 0 {
           map.serialize_entry("name", "CAN Bit Stuffing Error");
           map.serialize_entry("description", "Whhyy is everybody sending bullshit!");
       } else if self.data & 4 != 0 {
           map.serialize_entry("name", "CAN Form Error");
           map.serialize_entry("description", "Somebody in this network is to stupid to follow CAN standards!");
       } else if self.data & 8 != 0 {
           map.serialize_entry("name", "CAN ACK Error");
           map.serialize_entry("description", "Wait what CAN has ACK!");
       } else if self.data & 16 != 0 {
           map.serialize_entry("name", "CAN CRC Error");
           map.serialize_entry("description", "Some CRC was computed incorrectly!");
       } else {
           map.serialize_entry("name", "Internal Error");
           map.serialize_entry("description", "The CNL fucked up some how!");
       }
       map.end()
    }
}
