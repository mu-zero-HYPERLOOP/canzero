use can_config_rs::config;
use serde::{ser::SerializeMap, Serialize};

/**
 * Serialized Into
 *
 * SignalFrame = {
 *    id : number,
 *    ide : boolean,
 *    rtr : boolean,
 *    dlc : number,
 *    signal : [
 *        {
 *          name : string,
 *          description? : string,
 *          value : number,
 *        },
 *        ...
 *    ],
 *    name : string,
 *    description? : string,
 *    data : number
 * }
 *
 */

#[derive(Clone)]
pub struct SignalFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    signals: Vec<Signal>,
    message_ref: config::MessageRef,
    data: u64,
}

impl PartialEq for SignalFrame {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
            && self.ide == other.ide
            && self.data == other.data
            && self.rtr
            && other.rtr
    }
}

impl SignalFrame {
    pub fn new(
        id: u32,
        ide: bool,
        rtr: bool,
        dlc: u8,
        signals: Vec<Signal>,
        message_ref: config::MessageRef,
        data: u64,
    ) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
            signals,
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
    pub fn signals(&self) -> &Vec<Signal> {
        &self.signals
    }
    pub fn into_signals(self) -> Vec<Signal> {
        self.signals
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

#[derive(Clone)]
pub struct Signal {
    signal_ref: config::SignalRef,
    value: SignalValue,
}

impl Signal {
    pub fn new(signal_ref: config::SignalRef, value: SignalValue) -> Self {
        Self { signal_ref, value }
    }
    pub fn name(&self) -> &str {
        self.signal_ref.name()
    }
    pub fn value(&self) -> &SignalValue {
        &self.value
    }
}

#[derive(Clone)]
pub enum SignalValue {
    Unsigned(u64),
    Signed(i64),
    Real(f64),
}

impl Serialize for Signal {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut map = serializer.serialize_map(None)?;
        map.serialize_entry("value", self.value());
        map.serialize_entry("name", self.name());
        match self.signal_ref.description() {
            Some(desc) => map.serialize_entry("description", desc)?,
            None => (),
        };
        map.end()
    }
}

impl Serialize for SignalValue {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match &self {
            SignalValue::Unsigned(v) => serializer.serialize_u64(*v),
            SignalValue::Signed(v) => serializer.serialize_i64(*v),
            SignalValue::Real(v) => serializer.serialize_f64(*v),
        }
    }
}

impl Serialize for SignalFrame {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut map = serializer.serialize_map(None)?;
        map.serialize_entry("id", &self.id)?;
        map.serialize_entry("ide", &self.ide)?;
        map.serialize_entry("rtr", &self.rtr)?;
        map.serialize_entry("dlc", &self.dlc)?;
        map.serialize_entry("signals", &self.signals)?;
        map.serialize_entry("name", &self.message_ref.name());
        match self.message_ref.description() {
            Some(desc) => map.serialize_entry("description", desc)?,
            None => (),
        };
        map.serialize_entry("data", &self.data)?;
        map.end()
    }
}
