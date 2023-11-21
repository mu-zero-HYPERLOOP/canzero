use serde::Serialize;

use crate::can::frame::{
    error_frame::ErrorFrame,
    signal_frame::{Signal, SignalFrame},
    type_frame::{FrameType, TypeFrame},
    undefined_frame::UndefinedFrame,
    Frame,
};

#[derive(Clone, Serialize, PartialEq, Debug)]
#[allow(dead_code)]
pub enum SerializedFrame {
    SignalFrame(SerializedSignalFrame),
    TypeFrame(SerializedTypeFrame),
    UndefinedFrame(SerializedUndefinedFrame),
    ErrorFrame(SerializedErrorFrame),
}

impl From<Frame> for SerializedFrame {
    fn from(value: Frame) -> Self {
        match value {
            Frame::SignalFrame(signal_frame) => {
                Self::SignalFrame(SerializedSignalFrame::from(signal_frame))
            }
            Frame::TypeFrame(type_frame) => Self::TypeFrame(SerializedTypeFrame::from(type_frame)),
            Frame::UndefinedFrame(undefined_frame) => {
                Self::UndefinedFrame(SerializedUndefinedFrame(undefined_frame))
            }
            Frame::ErrorFrame(error_frame) => Self::ErrorFrame(SerializedErrorFrame(error_frame)),
        }
    }
}

#[derive(Clone, Serialize, PartialEq, Debug)]
#[allow(dead_code)]
pub struct SerializedSignalFrame {
    pub id: u32,
    pub ide: bool,
    pub rtr: bool,
    pub dlc: u8,
    pub signals: Vec<SerializedSignal>,
    pub data : u64,
}
impl From<SignalFrame> for SerializedSignalFrame {
    fn from(value: SignalFrame) -> Self {
        Self {
            id: value.id(),
            ide: value.ide(),
            rtr: value.rtr(),
            dlc: value.dlc(),
            signals: value
                .into_signals()
                .into_iter()
                .map(|signal| SerializedSignal::from(signal))
                .collect(),
            data : value.data(),
        }
    }
}

#[derive(Clone, Serialize, PartialEq, Debug)]
#[allow(dead_code)]
pub struct SerializedSignal {
    pub name: String,
    pub value: String,
}
impl From<Signal> for SerializedSignal {
    fn from(value: Signal) -> Self {
        Self {
            name: value.name().to_owned(),
            value: match value.value() {
                crate::can::frame::signal_frame::SignalValue::Unsigned(v) => format!("{v}"),
                crate::can::frame::signal_frame::SignalValue::Signed(v) => format!("{v}"),
                crate::can::frame::signal_frame::SignalValue::Real(v) => format!("{v}"),
            },
        }
    }
}

#[derive(Clone, Serialize, PartialEq, Debug)]
#[allow(dead_code)]
pub struct SerializedTypeFrame {
    pub id: u32,
    pub ide: bool,
    pub rtr: bool,
    pub dlc: u8,
    pub attributes: Vec<SerializedAttribute>,
    pub name: String,
    pub description: Option<String>,
    pub data : u64,
}
impl From<TypeFrame> for SerializedTypeFrame {
    fn from(value: TypeFrame) -> Self {
        fn frame_type_to_serialized_attribute(frame_type: &FrameType) -> SerializedAttribute {
            match frame_type.value() {
                crate::can::frame::type_frame::TypeValue::Unsigned(v) => {
                    SerializedAttribute::Unsigned {
                        name: frame_type.name().to_owned(),
                        value: *v,
                    }
                }
                crate::can::frame::type_frame::TypeValue::Signed(v) => {
                    SerializedAttribute::Signed {
                        name: frame_type.name().to_owned(),
                        value: *v,
                    }
                }
                crate::can::frame::type_frame::TypeValue::Real(v) => SerializedAttribute::Real {
                    name: frame_type.name().to_owned(),
                    value: *v,
                },
                crate::can::frame::type_frame::TypeValue::Composite(comp) => {
                    SerializedAttribute::Composite {
                        name: frame_type.name().to_owned(),
                        value: comp
                            .attributes()
                            .iter()
                            .map(frame_type_to_serialized_attribute)
                            .collect(),
                    }
                }
                crate::can::frame::type_frame::TypeValue::Root(_) => panic!(),
                crate::can::frame::type_frame::TypeValue::Enum(type_ref, value) => {
                    SerializedAttribute::Enum {
                        name: frame_type.name().to_owned(),
                        value: value.clone(),
                    }
                }
                crate::can::frame::type_frame::TypeValue::Array(_) => todo!(),
            }
        }
        SerializedTypeFrame {
            id: value.id(),
            ide: value.ide(),
            rtr: value.rtr(),
            dlc: value.dlc(),
            attributes: value
                .value()
                .iter()
                .map(frame_type_to_serialized_attribute)
                .collect(),
            name: value.name().to_owned(),
            description: match value.description() {
                Some(desc) => Some(desc.to_owned()),
                None => None,
            },
            data : value.data(),
        }
    }
}

#[derive(Clone, Serialize, PartialEq, Debug)]
pub enum SerializedAttribute {
    Unsigned {
        name: String,
        value: u64,
    },
    Signed {
        name: String,
        value: i64,
    },
    Real {
        name: String,
        value: f64,
    },
    Composite {
        name: String,
        value: Vec<SerializedAttribute>,
    },
    Enum {
        name: String,
        value: String,
    },
}

#[derive(Clone, Serialize, PartialEq, Debug)]
pub struct SerializedUndefinedFrame(pub UndefinedFrame);
impl From<UndefinedFrame> for SerializedUndefinedFrame {
    fn from(value: UndefinedFrame) -> Self {
        SerializedUndefinedFrame(value)
    }
}

#[derive(Clone, Serialize, PartialEq, Debug)]
pub struct SerializedErrorFrame(pub ErrorFrame);
impl From<ErrorFrame> for SerializedErrorFrame {
    fn from(value: ErrorFrame) -> Self {
        SerializedErrorFrame(value)
    }
}
