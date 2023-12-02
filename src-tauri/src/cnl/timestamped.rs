use std::ops::Deref;

pub struct Timestamped<T> {
    instant : std::time::Instant,
    value : T,
}

impl<T> Deref for Timestamped<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.value
    }
}

impl<T> Timestamped<T> {
    pub fn new(timestamp : std::time::Instant, value : T) -> Self{
        Self {
            instant : timestamp,
            value
        }
    }

    pub fn now(value : T) -> Self {
        Self {
            instant : std::time::Instant::now(),
            value,
        }
    }
    pub fn timestamp(&self) -> &std::time::Instant {
        &self.instant
    }

    pub fn destruct(self) -> (std::time::Instant, T) {
        (self.instant, self.value)
    }
}

