use can_config_rs::config::Type;

use crate::cnl::frame::Value;


pub struct TypeDeserializer {

}

impl TypeDeserializer {
    pub fn new(ty:  &Type, bit_offset : u32) -> Self{
        Self {
        }
    }

    pub fn deserialize(&self, data : &[u8]) -> Value {
        // TODO implement me please =^(.
        Value::UnsignedValue(0)
    }
}
