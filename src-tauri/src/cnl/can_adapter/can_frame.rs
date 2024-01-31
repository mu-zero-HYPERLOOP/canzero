#[derive(Debug)]
pub struct CanFrame {
    id: u32,
    dlc: u8,
    data: u64,
}

enum CanFrameIdFlags {
    IdeMask = 0x80000000,
    RtrMask = 0x40000000,
    #[allow(dead_code)]
    StdMask = 0x7FF,
    ExtMask = 0x1FFFFFFF,
}

impl CanFrame {
    pub fn new(id: u32, ide: bool, rtr: bool, dlc: u8, data: u64) -> Self {
        Self {
            id: id
                | (if ide {
                    CanFrameIdFlags::IdeMask as u32
                } else {
                    0x0u32
                })
                | (if rtr {
                    CanFrameIdFlags::RtrMask as u32
                } else {
                    0x0u32
                }),
            dlc,
            data,
        }
    }

    pub fn key(&self) -> u32 {
        self.id
    }

    pub fn get_id(&self) -> u32 {
        self.id & CanFrameIdFlags::ExtMask as u32
    }
    #[allow(dead_code)]
    pub fn set_id(&mut self, id: u32) {
        self.id = id;
    }
    pub fn get_ide_flag(&self) -> bool {
        (self.id & CanFrameIdFlags::IdeMask as u32) != 0
    }
    pub fn get_rtr_flag(&self) -> bool {
        (self.id & CanFrameIdFlags::RtrMask as u32) != 0
    }
    pub fn get_dlc(&self) -> u8 {
        self.dlc
    }
    #[allow(dead_code)]
    pub fn set_dlc(&mut self, dlc: u8) {
        self.dlc = dlc;
    }
    pub fn get_data_u64(&self) -> u64 {
        self.data
    }
    #[allow(dead_code)]
    pub fn get_data_8u8(&self) -> [u8; 8] {
        unsafe { std::mem::transmute::<u64, [u8; 8]>(self.data) }
    }
    #[allow(dead_code)]
    pub fn set_data_u64(&mut self, data: u64) {
        self.data = data;
    }
    #[allow(dead_code)]
    pub fn set_data_8u8(&mut self, data: [u8; 8]) {
        self.data = u64::from_be_bytes(data);
    }
}
