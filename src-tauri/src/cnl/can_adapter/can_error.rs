use std::sync::Arc;


#[derive(Debug, Clone)]
pub enum CanError {
    #[allow(unused)]
    Io(Arc<std::io::Error>),
    #[allow(unused)]
    Disconnect(String),
    #[allow(unused)]
    Can(u64),
}
