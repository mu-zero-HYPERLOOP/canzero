
pub struct TcpAddressState {
    pub address : String,
}

impl TcpAddressState {
    pub fn new(address: &str) -> Self {
        Self {
           address : address.to_owned(),
        }
    }
}
