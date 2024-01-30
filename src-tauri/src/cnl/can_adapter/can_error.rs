
#[derive(Debug)]
pub enum CanError {
    #[allow(unused)]
    Io(std::io::Error),
    #[allow(unused)]
    Disconnect(String),
    #[allow(unused)]
    Can(u64),
}
