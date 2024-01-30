

#[derive(Debug)]
pub struct CanFrame {
    id: u32,
    ide: bool,
    rtr: bool,
    dlc: u8,
    data: u64,
}

impl CanFrame {
    pub fn new(id: u32, ide: bool, rtr: bool, dlc: u8, data: u64) -> Self {
        Self {
            id,
            ide,
            rtr,
            dlc,
            data,
        }
    }

    pub fn get_id(&self) -> u32 {
        self.id
    }
    #[allow(dead_code)]
    pub fn set_id(&mut self, id: u32) {
        self.id = id;
    }
    #[allow(dead_code)]
    pub fn set_ext_id(&mut self, id: u32) {
        self.id = id;
        self.ide = true;
    }
    pub fn get_ide_flag(&self) -> bool {
        self.ide
    }
    #[allow(dead_code)]
    pub fn set_ide_flag(&mut self, ide: bool) {
        self.ide = ide;
    }
    pub fn get_rtr_flag(&self) -> bool {
        self.rtr
    }
    #[allow(dead_code)]
    pub fn set_rtr_flag(&mut self, rtr: bool) {
        self.rtr = rtr
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
