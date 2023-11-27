use std::ops::Index;

use can_config_rs::config;
use serde::{
    ser::{SerializeMap, SerializeSeq},
    Serialize, Serializer,
};

/**
 *
 *  Serialized into
 *  
 *
 *  {
 *    id : number,
 *    ide : bool,
 *    rtr : bool,
 *    dlc : number,
 *    name : string,
 *    description? : string,
 *    data : number,
 *    attributes : [
 *        {
 *            name : string,
 *            value : number | string
 *        }
 *    ],
 *  }
 */

#[derive(Debug, Clone)]
pub struct TypeFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    value: Vec<FrameType>,
    message_ref: config::MessageRef,
    data: u64,
}

impl PartialEq for TypeFrame {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
            && self.ide == other.ide
            && self.data == other.data
            && self.rtr == other.rtr
    }
}

impl TypeFrame {
    pub fn new(
        id: u32,
        ide: bool,
        rtr: bool,
        dlc: u8,
        value: Vec<FrameType>,
        message_ref: config::MessageRef,
        data: u64,
    ) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
            value,
            message_ref,
            data,
        }
    }
    pub fn id(&self) -> u32 {
        self.id
    }
    pub fn ide(&self) -> bool {
        self.ide
    }
    pub fn rtr(&self) -> bool {
        self.rtr
    }
    pub fn dlc(&self) -> u8 {
        self.dlc
    }
    pub fn value(&self) -> &Vec<FrameType> {
        &self.value
    }
    pub fn name(&self) -> &str {
        self.message_ref.name()
    }
    pub fn description(&self) -> Option<&str> {
        self.message_ref.description()
    }
    pub fn data(&self) -> u64 {
        self.data
    }
}

#[derive(Clone, Debug)]
pub struct FrameType {
    name: String,
    value: TypeValue,
}

impl FrameType {
    pub fn new(name: String, value: TypeValue) -> Self {
        Self { name, value }
    }
    pub fn value(&self) -> &TypeValue {
        &self.value
    }
    pub fn name(&self) -> &str {
        &self.name
    }
}

#[derive(Clone, Debug)]
pub enum TypeValue {
    Unsigned(u64),
    Signed(i64),
    Real(f64),
    Composite(CompositeTypeValue),
    Root(Vec<FrameType>),
    Enum(config::TypeRef, String),
    Array(ArrayTypeValue),
}

#[derive(Clone, Debug)]
pub struct CompositeTypeValue {
    attributes: Vec<FrameType>,
    ty: config::TypeRef,
}

impl CompositeTypeValue {
    pub fn new(attributes: Vec<FrameType>, ty: &config::TypeRef) -> Self {
        Self {
            attributes,
            ty: ty.clone(),
        }
    }
    pub fn attributes(&self) -> &Vec<FrameType> {
        &self.attributes
    }
    pub fn at(&self, index: &str) -> Option<&FrameType> {
        self.attributes.iter().find(|a| a.name() == index)
    }
}

#[derive(Clone, Debug)]
pub struct ArrayTypeValue {
    values: Vec<TypeValue>,
}

impl ArrayTypeValue {
    pub fn new(values: Vec<TypeValue>) -> Self {
        Self { values }
    }
    pub fn size(&self) -> usize {
        self.values.len()
    }
    pub fn at(&self, index: usize) -> Option<&TypeValue> {
        self.values.get(index)
    }
}

impl Index<usize> for ArrayTypeValue {
    type Output = TypeValue;

    fn index(&self, index: usize) -> &Self::Output {
        &self.values[index]
    }
}

impl Serialize for TypeFrame {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut map = serializer.serialize_map(None)?;
        map.serialize_entry("id", &self.id)?;
        map.serialize_entry("ide", &self.ide)?;
        map.serialize_entry("rtr", &self.rtr)?;
        map.serialize_entry("dlc", &self.dlc)?;
        map.serialize_entry("name", self.name())?;
        match self.description() {
            Some(desc) => map.serialize_entry("description", desc)?,
            None => (),
        };

        #[derive(Serialize)]
        struct SerializedAttribute<'a, T: Serialize> {
            name: &'a str,
            value: &'a T,
        }

        struct SerializedAttributes<'a>(&'a Vec<FrameType>);

        impl<'a> Serialize for SerializedAttributes<'a> {
            fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: serde::Serializer,
            {
                let mut seq = serializer.serialize_seq(None)?;

                fn rec<S: Serializer>(
                    frame_type: &FrameType,
                    seq: &mut S::SerializeSeq,
                    pre: &str,
                ) -> Result<(), S::Error> {
                    match &frame_type.value {
                        TypeValue::Unsigned(v) => seq.serialize_element(&SerializedAttribute {
                            name: &format!("{pre}{}", frame_type.name),
                            value: v,
                        }),
                        TypeValue::Signed(v) => seq.serialize_element(&SerializedAttribute {
                            name: &format!("{pre}{}", frame_type.name),
                            value: v,
                        }),
                        TypeValue::Real(v) => seq.serialize_element(&SerializedAttribute {
                            name: &format!("{pre}{}", frame_type.name),
                            value: v,
                        }),
                        TypeValue::Enum(_, v) => seq.serialize_element(&SerializedAttribute {
                            name: &format!("{pre}{}", frame_type.name),
                            value: v,
                        }),
                        TypeValue::Composite(composite) => {
                            for attrib in &composite.attributes {
                                rec::<S>(attrib, seq, &format!("{pre}{}.", frame_type.name))?;
                            }
                            Ok(())
                        }
                        TypeValue::Root(_) => panic!(),
                        TypeValue::Array(_) => todo!(),
                    }
                }

                for attrib in self.0 {
                    rec::<S>(attrib, &mut seq, "")?;
                }
                seq.end()
            }
        }

        map.serialize_entry("attributes", &SerializedAttributes(&self.value))?;

        map.serialize_entry("data", &self.data)?;
        map.end()
    }
}
