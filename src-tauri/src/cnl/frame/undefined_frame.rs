use serde::Serialize;

#[derive(Clone, Serialize, PartialEq, Debug)]
pub struct UndefinedFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    data: u64,
}

impl UndefinedFrame {
    pub fn new(id: u32, ide: bool, rtr: bool, dlc: u8, data: u64) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
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
    #[allow(unused)]
    pub fn dlc(&self) -> u8 {
        self.dlc
    }
    #[allow(unused)]
    pub fn data(&self) -> u64 {
        self.data
    }
}
