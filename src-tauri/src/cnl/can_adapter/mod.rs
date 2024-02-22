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
#[cfg(feature = "tcp-can")]
mod tcp;
#[cfg(feature = "tcp-can")]
pub struct CanAdapter(self::tcp::TcpCanAdapter, BusRef);

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

#[cfg(feature = "socket-can")]
pub async fn create_can_adapters(network: &NetworkRef) -> Vec<CanAdapter> {
    network
        .buses()
        .iter()
        .map(|bus_ref| CanAdapter::create(bus_ref, network))
        .collect()
}

#[cfg(feature = "mock-can")]
pub async fn create_can_adapters(network: &NetworkRef) -> Vec<CanAdapter> {
    network
        .buses()
        .iter()
        .map(|bus_ref| CanAdapter::create(bus_ref, network))
        .collect()
}

#[cfg(feature = "tcp-can")]
pub async fn create_can_adapters(network: &NetworkRef, tcp_address : &str) -> Vec<CanAdapter> {
    let channels: Vec<(
        (
            tokio::sync::mpsc::Sender<TCanFrame>,
            tokio::sync::mpsc::Receiver<TCanFrame>,
        ),
        (
            tokio::sync::mpsc::Sender<TCanError>,
            tokio::sync::mpsc::Receiver<TCanError>,
        ),
    )> = network
        .buses()
        .iter()
        .map(|_| {
            (
                tokio::sync::mpsc::channel(16),
                tokio::sync::mpsc::channel(16),
            )
        })
        .collect();

    let tx_channels: Vec<(
        tokio::sync::mpsc::Sender<TCanFrame>,
        tokio::sync::mpsc::Sender<TCanError>,
    )> = channels
        .iter()
        .map(|((tx, _rx), (tx_err, _rx_err))| (tx.clone(), tx_err.clone()))
        .collect();

    let tcp_client = std::sync::Arc::new(
        self::tcp::client::TcpClient::create(tcp_address, tx_channels).await,
    );

    std::iter::zip(network.buses().iter(), channels.into_iter())
        .map(|(bus_ref, ((_tx, rx), (_tx_err, rx_err)))| {
            CanAdapter(
                self::tcp::TcpCanAdapter::create(tcp_client.clone(), bus_ref.id(), rx, rx_err),
                bus_ref.clone(),
            )
        })
        .collect()
}
