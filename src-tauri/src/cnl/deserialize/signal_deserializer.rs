use can_config_rs::config::SignalRef;

use crate::cnl::frame::Value;

pub struct SignalDeserializer {
    bit_mask: u64,
    bit_offset: u32,
    type_info: SignalDeserializerTypeInfo,
}

enum SignalDeserializerTypeInfo {
    DecimalSignalDeserializer { offset: f64, scale: f64 },
    UnsignedSignalDeserializer,
    SignedSignalDeserializer,
}

impl SignalDeserializer {
    pub fn new(signal: &SignalRef) -> Self {
        let bit_offset = signal.byte_offset() as u32; // NOTE stupid naming =^)
        let bit_size = signal.size() as u32;
        Self {
            bit_offset,
            bit_mask : (u64::MAX.overflowing_shr(u64::BITS - bit_size)).0,
            type_info: match signal.ty() {
                can_config_rs::config::SignalType::UnsignedInt { size: _ } => {
                    SignalDeserializerTypeInfo::UnsignedSignalDeserializer
                }
                can_config_rs::config::SignalType::SignedInt { size: _ } => {
                    SignalDeserializerTypeInfo::SignedSignalDeserializer
                }
                can_config_rs::config::SignalType::Decimal {
                    size: _,
                    offset,
                    scale,
                } => SignalDeserializerTypeInfo::DecimalSignalDeserializer {
                    offset: *offset,
                    scale: *scale,
                },
            },
        }
    }

    pub fn deserialize(&self, data: u64) -> Value {
        let unsigned_bits =
            data.overflowing_shr(self.bit_offset).0 & self.bit_mask;
        match &self.type_info {
            SignalDeserializerTypeInfo::DecimalSignalDeserializer { offset, scale } => {
                Value::RealValue(unsigned_bits as f64 * scale + offset)
            }
            SignalDeserializerTypeInfo::UnsignedSignalDeserializer => {
                Value::UnsignedValue(unsigned_bits)
            }
            SignalDeserializerTypeInfo::SignedSignalDeserializer => {
                Value::SignedValue(unsafe { std::mem::transmute(unsigned_bits) })
            }
        }
    }
}
