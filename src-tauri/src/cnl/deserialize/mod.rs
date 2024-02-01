use can_config_rs::config::MessageRef;

use self::encoding_deserializer::EncodedDeserializer;

mod encoding_deserializer;
mod signal_deserializer;

pub struct FrameDeserializer {
    attribute_deserializer: Vec<AttributeDeserializer>,
}

pub enum Value {
    UnsignedValue(u64),
    SignedValue(i64),
    RealValue(f64),
    StructValue(Vec<Attribute>),
    EnumValue(String),
}

pub struct FrameValue {
    attributes: Vec<Attribute>,
}

pub struct Attribute {
    name: String,
    value: Value,
}

struct AttributeDeserializer {
    attribute_name: String,
    encoded_deserializer: EncodedDeserializer,
}

impl AttributeDeserializer {
    pub fn new(name: &str, encoded_deserializer: EncodedDeserializer) -> Self {
        Self {
            attribute_name: name.to_owned(),
            encoded_deserializer,
        }
    }
    pub fn deserialize(&self, data: u64) -> Attribute {
        Attribute {
            name: self.attribute_name.clone(),
            value: self.encoded_deserializer.deserializer(data),
        }
    }
}

impl FrameDeserializer {
    pub fn new(message_config: &MessageRef) -> FrameDeserializer {
        match message_config.encoding() {
            Some(message_encoding) => {
                // NOTE create encoded deserializer based on encoding
                Self {
                    attribute_deserializer: message_encoding
                        .attributes()
                        .iter()
                        .map(|type_encoding| {
                            AttributeDeserializer::new(
                                type_encoding.name(),
                                EncodedDeserializer::new(type_encoding),
                            )
                        })
                        .collect(),
                }
            }
            None => Self {
                attribute_deserializer: message_config
                    .signals()
                    .iter()
                    .map(|signal| {
                        AttributeDeserializer::new(
                            signal.name(),
                            EncodedDeserializer::new_from_signal(signal),
                        )
                    })
                    .collect(),
            },
        }
    }

    pub fn deserialize(&self, data: u64) -> FrameValue {
        FrameValue {
            attributes: self
                .attribute_deserializer
                .iter()
                .map(|attrib_deserializer| attrib_deserializer.deserialize(data))
                .collect(),
        }
    }
}
