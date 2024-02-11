use can_config_rs::config::{bus::BusRef, NetworkRef};

use self::{can_error::CanError, can_frame::CanFrame, timestamped::Timestamped};

pub mod can_error;
pub mod can_frame;
pub mod timestamped;

pub type TCanError = Timestamped<CanError>;
pub type TCanFrame = Timestamped<CanFrame>;

// socket-can
#[cfg(feature = "socket-can")]
mod socket_can;
#[cfg(feature = "socket-can")]
pub struct CanAdapter(self::socket_can::SocketCanAdapter, BusRef);
#[cfg(feature = "socket-can")]
impl CanAdapter {
    #[allow(unused_variables)]
    #[inline]
    pub fn create(bus: &BusRef, network_config: &NetworkRef) -> CanAdapter {
        CanAdapter(
            self::socket_can::SocketCanAdapter::create(bus)
                .expect("failed to setup socket can adapter"),
            bus.clone(),
        )
    }
}

// mock-can
#[cfg(feature = "mock-can")]
mod mock_can;
#[cfg(feature = "mock-can")]
pub struct CanAdapter(self::mock_can::MockCanAdapter, BusRef);
#[cfg(feature = "mock-can")]
impl CanAdapter {
    #[allow(unused_variables)]
    #[inline]
    pub fn create(bus: &BusRef, network: &NetworkRef) -> CanAdapter {
        CanAdapter(
            self::mock_can::MockCanAdapter::create(bus, network),
            bus.clone(),
        )
    }
}

// tcp-can
#[cfg(feature="tcp-can")]
mod tcp;
#[cfg(feature="tcp-can")]
pub struct CanAdapter(self::tcp::TcpCanAdapter, BusRef);
#[cfg(feature="tcp-can")]
impl CanAdapter {
    pub fn create(bus : &BusRef, network: &NetworkRef) -> CanAdapter {
        CanAdapter(
            self::tcp::TcpCanAdapter::create(bus),
            bus.clone()
        )
    }
}


trait CanAdapterInterface {
    async fn receive(&self) -> Result<Timestamped<CanFrame>, Timestamped<CanError>>;

    async fn receive_err(&self) -> Timestamped<CanError>;

    async fn send(&self, frame: CanFrame);
}

impl CanAdapter {
    #[inline]
    pub async fn receive(&self) -> Result<Timestamped<CanFrame>, Timestamped<CanError>> {
        self.0.receive().await
    }

    #[inline]
    pub async fn receive_err(&self) -> Timestamped<CanError> {
        self.0.receive_err().await
    }

    #[inline]
    pub async fn send(&self, frame: CanFrame) {
        self.0.send(frame).await
    }
    pub fn bus(&self) -> &BusRef {
        &self.1
    }
}
