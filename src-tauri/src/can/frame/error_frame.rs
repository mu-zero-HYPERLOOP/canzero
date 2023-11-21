use serde::Serialize;



#[derive(Clone, Serialize, PartialEq, Debug)]
pub struct ErrorFrame {
    data : u64
}

impl ErrorFrame {
    pub fn new(data : u64) -> Self {
        Self {
            data
        }
    }
}


