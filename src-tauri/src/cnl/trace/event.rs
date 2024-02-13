use std::{
    ops::Deref,
    time::{Duration, Instant},
};

use serde::{ser::SerializeMap, Serialize};

use super::frame::TraceFrame;

#[derive(Clone)]
pub struct TraceEvent {
    frame: TraceFrame,
    bus: String,
    key: u64,
    delta_time: Duration,
    absolute_time: Duration,
    arrive : Instant,
}

impl TraceEvent {
    // pub fn new(bus_name : &str, frame: TraceFrame, delta_time: Duration, absolute_time: Duration) -> Self {
    //     Self {
    //         frame,
    //         delta_time,
    //         absolute_time,
    //         bus : bus_name.to_string(),
    //     }
    // }
    pub fn new_relative(
        bus_name: &str,
        bus_id: u32,
        frame: TraceFrame,
        start: Instant,
        prev: Option<Duration>,
        arrive: Instant,
    ) -> Self {
        let absolute_time = arrive.saturating_duration_since(start);
        let delta_time = match prev {
            Some(prev) => absolute_time.saturating_sub(prev),
            None => absolute_time,
        };
        Self {
            delta_time,
            absolute_time,
            bus: bus_name.to_owned(),
            key: (bus_id as u64) << 32 | (frame.key_u32() as u64),
            frame,
            arrive,
        }
    }
    pub fn bus(&self) -> &str {
        &self.bus
    }
    pub fn delta_time(&self) -> &Duration {
        &self.delta_time
    }
    pub fn absolute_time(&self) -> &Duration {
        &self.absolute_time
    }
}

impl Serialize for TraceEvent {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut map = serializer.serialize_map(Some(3))?;
        map.serialize_entry("frame", &self.frame)?;
        map.serialize_entry("deltaTime", &format!("{}", self.delta_time.as_millis()))?;
        map.serialize_entry("timeSinceLast", &Instant::now().duration_since(self.arrive).as_millis())?;
        map.serialize_entry("bus", &self.bus)?;
        map.serialize_entry("key", &self.key)?;
        map.serialize_entry(
            "absoluteTime",
            &format!("{}", self.absolute_time.as_millis()),
        )?;
        map.end()
    }
}

impl Deref for TraceEvent {
    type Target = TraceFrame;

    fn deref(&self) -> &Self::Target {
        &self.frame
    }
}
