use bitvec::{vec::BitVec, prelude::Msb0};
use can_config_rs::config;
use serde::{
    ser::{SerializeMap, SerializeSeq},
    Serialize, Serializer,
};
use config::{Type, SignalType};

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
    #[allow(unused)]
    pub fn rtr(&self) -> bool {
        self.rtr
    }
    #[allow(dead_code)]
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
    #[allow(dead_code)]
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

    #[allow(unused)]
    pub fn at(&self, index: &str) -> Option<&FrameType> {
        self.attributes.iter().find(|a| a.name() == index)
    }

    #[allow(unused)]
    pub fn ty(&self) -> &config::TypeRef {
        &self.ty
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

impl Serialize for TypeValue {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer {
        match &self {
            TypeValue::Unsigned(v) => serializer.serialize_u64(*v),
            TypeValue::Signed(v) => serializer.serialize_i64(*v),
            TypeValue::Real(v) => serializer.serialize_f64(*v),
            TypeValue::Composite(composite) => {
                let mut map = serializer.serialize_map(Some(composite.attributes.len()))?;
                for attrib in &composite.attributes {
                    map.serialize_entry(attrib.name(), attrib.value())?;
                }
                map.end()
            }
            TypeValue::Root(_) => panic!(),
            TypeValue::Enum(_, v) => serializer.serialize_str(v),
        }
    }
}

impl TypeValue {
    pub fn get_as_bin(&self, ty: &config::Type) -> Vec<u64> {
        let mut bit_vec: BitVec<u64, Msb0> = BitVec::new();

        fn continue_get_as_bin(
                type_value: &TypeValue, 
                ty: &config::Type, 
                bit_vec: &mut BitVec<u64, Msb0>, 
            ) {
            match (type_value, ty) {
                (TypeValue::Unsigned(val), Type::Primitive(SignalType::UnsignedInt{ size })) => {
                    for i in (0..*size).rev() {
                        let bit_int = (*val >> i) & 0x1;
                        bit_vec.push(if bit_int == 0 { false } else { true });
                    }
                },
                (TypeValue::Signed(val), config::Type::Primitive(SignalType::SignedInt{ size })) => {
                    for i in (0..*size).rev() {
                        let bit_int = (*val >> i) & 0x1;
                        bit_vec.push(if bit_int == 0 { false } else { true });
                    }
                },
                (TypeValue::Real(val), config::Type::Primitive(SignalType::Decimal { size, offset, scale })) => {
                    let base_float = (val - offset) / scale;
                    let base_bits = base_float.round() as i64;
                    // just in case floating point errors fuck us. 
                    // not sure if actually needed.
                    let base_bits: u64 = if base_bits < 0 { 
                        0 
                    } else if (base_bits >> size) > 0 { 
                        0xffff_ffff_ffff_ffff 
                    } else {
                        base_bits as u64
                    };
                    for i in (0..*size).rev() {
                        let bit_int = (base_bits >> i) & 0x1;
                        bit_vec.push(if bit_int == 0 { false } else { true });
                    }
                },
                (TypeValue::Composite(val), config::Type::Struct { 
                    name: _, 
                    description: _, 
                    attribs, 
                    visibility: _ 
                }) => {
                    for (nested_val, nested_type) in val.attributes().iter().zip(
                        attribs.iter().map(|attr| attr.1.clone())) {
                        continue_get_as_bin(nested_val.value(), nested_type.as_ref(), bit_vec)
                    }
                },
                (TypeValue::Enum(_, variant_name), config::Type::Enum { 
                    name: _, 
                    description: _, 
                    size, 
                    entries, 
                    visibility: _
                }) => {
                    if let Some(enum_val) = entries.iter().find(|(name, _)| name == variant_name) {
                        let bit_val = enum_val.1;
                        for i in (0..*size).rev() {
                            let bit_int = (bit_val >> i) & 0x1;
                            bit_vec.push(if bit_int == 0 { false } else { true });
                        }
                    } else {
                        panic!("variant name not known!");
                    };
                },
                _ => panic!("TypeValue and config::Type did not match!")
            };
        }

        continue_get_as_bin(self, ty, &mut bit_vec);

        bit_vec.set_uninitialized(false);
        let vec_u64 = bit_vec.into_vec();
        println!("TypeValue as vec<u64>: {vec_u64:?}");
        return vec_u64;
    }
}

