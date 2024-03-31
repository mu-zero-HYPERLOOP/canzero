use std::{ops::Deref, time::Duration};

pub struct Timestamped<T> {
    timestamp : Duration,
    value : T,
}

impl<T> Deref for Timestamped<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

impl<T> Timestamped<T> {
    pub fn new(timestamp : Duration, value : T) -> Self{
        Self {
            timestamp,
            value
        }
    }

    pub fn timestamp(&self) -> &Duration {
        &self.timestamp
    }

    pub fn destruct(self) -> (Duration, T) {
        (self.timestamp, self.value)
    }

    pub fn new_value<R>(&self, value : R) -> Timestamped<R> {
        Timestamped::new(*self.timestamp(), value)
    }
}

