use serde::{Deserialize, de::Visitor};

use crate::cnl::frame::type_frame::TypeValue;

struct SetRequest {
    node: String,
    oe_id: usize,
    type_value: TypeValue,
}

impl<'de> Deserialize<'de> for SetRequest {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(field_identifier, rename_all = "lowercase")]
        enum Field {
            Node,
            OeId,
            TypeValue,
        }

        struct SetRequestVisitor;
        impl<'de> Visitor<'de> for SetRequestVisitor {
            type Value = SetRequest;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("struct SetRequest")
            }

            fn visit_map<A>(self, map: A) -> Result<Self::Value, A::Error>
                where
                    A: serde::de::MapAccess<'de>, {
                        todo!()
                
            }

            

            
        }
        const FIELDS: &'static [&'static str] = &["node", "oe_id", "type_value"];
        deserializer.deserialize_struct("SetRequest", FIELDS, SetRequestVisitor)
    }
}
