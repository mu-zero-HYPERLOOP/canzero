use std::{
    io::{Read, Write},
    mem::size_of,
    net::TcpStream,
    sync::{OnceLock, RwLock},
};

use tokio::{
    runtime::Handle,
    sync::{
        mpsc::{Receiver, Sender},
        Mutex,
    },
};

use can_config_rs::config::bus::BusRef;

use super::{
    can_error::CanError, can_frame::CanFrame, timestamped::Timestamped, CanAdapterInterface,
    TCanError, TCanFrame,
};

static TCP_SINGLETON: TcpSingleton = TcpSingleton {
    address: OnceLock::new(),
    forward_to_adapters: RwLock::new(vec![]),
    transmit_queue: OnceLock::new(),
};

struct TcpSingleton {
    address: OnceLock<String>,
    forward_to_adapters: RwLock<Vec<(Sender<TCanFrame>, Sender<TCanError>)>>,
    transmit_queue:
        OnceLock<std::sync::Mutex<(Sender<(u32, CanFrame)>, Receiver<(u32, CanFrame)>)>>,
}

impl TcpSingleton {
    pub fn require_address(&'static self, address: &str) {
        self.address.get_or_init(move || address.to_owned());
        self.transmit_queue
            .get_or_init(move || {
                let x = std::sync::Mutex::new(tokio::sync::mpsc::channel(1024));
                TCP_SINGLETON.start().unwrap();
                x
            });
    }
    pub fn start(&'static self) -> Result<(), std::io::Error> {
        let address = self
            .address
            .get()
            .expect("address has to be required TcpSingleton is started");
        let stream = TcpStream::connect(address)?;
        let stream = CanTcpStream::new(stream);

        let mut rx_stream = stream.try_clone().expect("Failed to clone TcpStream (rx)");
        tokio::task::spawn_blocking(move || {
            loop {
                match rx_stream.receive() {
                    Ok(bus_frame) => {
                        Handle::current().block_on(async {
                            // forward to the correct can adapter
                            // TODO : error handling!
                            self.forward_to_adapters
                                .read()
                                .unwrap()
                                .get(bus_frame.bus_id as usize)
                                .unwrap()
                                .0
                                .send(Timestamped::now(bus_frame.can_frame))
                                .await
                                .unwrap()
                        });
                    }
                    Err(_) => {
                        panic!("TODO graceful shutdown");
                    }
                }
            }
        });

        let mut tx_stream = stream.try_clone().expect("Failed to clone TcpStream (tx)");

        tokio::task::spawn_blocking(move || loop {
            let (bus_id, can_frame) = Handle::current().block_on(async {
                self.transmit_queue
                    .get()
                    .unwrap()
                    .lock()
                    .unwrap()
                    .1
                    .recv()
                    .await
                    .expect("\'static sender closed early")
            });
            tx_stream.send(&BusFrame { bus_id, can_frame }).unwrap();
        });
        Ok(())
    }

    pub fn add_receive_channel(
        &'static self,
        bus_id: u32,
        tx: Sender<TCanFrame>,
        tx_err: Sender<TCanError>,
    ) {
        // NOTE pretty wild assumption =^).
        assert_eq!(
            self.forward_to_adapters.read().unwrap().len(),
            bus_id as usize
        );
        self.forward_to_adapters
            .write()
            .expect("failed to acquire adapter_forward_tx lock")
            .push((tx, tx_err));
    }

    pub async fn send(&'static self, bus_id: u32, can_frame: CanFrame) {
        self.transmit_queue
            .get()
            .unwrap()
            .lock()
            .unwrap()
            .0
            .send((bus_id, can_frame))
            .await
            .unwrap();
    }
}

struct BusFrame {
    can_frame: CanFrame,
    bus_id: u32,
}

struct CanTcpStream {
    tcp_stream: TcpStream,
}

impl CanTcpStream {
    pub fn new(tcp_stream: TcpStream) -> Self {
        Self { tcp_stream }
    }

    pub fn send(&mut self, bus_frame: &BusFrame) -> Result<(), std::io::Error> {
        let byte_slice: &[u8] = unsafe {
            ::core::slice::from_raw_parts(
                (bus_frame as *const BusFrame) as *const u8,
                size_of::<BusFrame>(),
            )
        };
        self.tcp_stream.write_all(byte_slice)
    }
    pub fn receive(&mut self) -> Result<BusFrame, std::io::Error> {
        let mut buffer: [u8; size_of::<BusFrame>()] = [0; size_of::<BusFrame>()];
        self.tcp_stream.read_exact(&mut buffer)?;
        Ok(unsafe { std::ptr::read(buffer.as_ptr() as *const _) })
    }

    pub fn try_clone(&self) -> Result<Self, std::io::Error> {
        Ok(Self {
            tcp_stream: self.tcp_stream.try_clone()?,
        })
    }
}

pub struct TcpCanAdapter {
    rx: Mutex<Receiver<TCanFrame>>,
    rx_err: Mutex<Receiver<TCanError>>,
    bus_id: u32,
}

impl TcpCanAdapter {
    pub fn create(bus: &BusRef) -> Self {
        TCP_SINGLETON.require_address("127.0.0.1:50000");
        let (tcp_tx, rx) = tokio::sync::mpsc::channel::<TCanFrame>(1024);
        let (tcp_err_tx, err_rx) = tokio::sync::mpsc::channel::<TCanError>(128);
        TCP_SINGLETON.add_receive_channel(bus.id(), tcp_tx, tcp_err_tx);
        Self {
            rx: Mutex::new(rx),
            rx_err: Mutex::new(err_rx),
            bus_id: bus.id(),
        }
    }
}

impl CanAdapterInterface for TcpCanAdapter {
    async fn receive(&self) -> Result<TCanFrame, TCanError> {
        let frame = self.rx.lock().await.recv().await;
        match frame {
            Some(frame) => Ok(frame),
            None => Err(Timestamped::now(CanError::Disconnect(format!(
                "can receive thread closed rx channel"
            )))),
        }
    }

    async fn receive_err(&self) -> Timestamped<CanError> {
        let error = self.rx_err.lock().await.recv().await;
        match error {
            Some(error) => error,
            None => Timestamped::now(CanError::Disconnect(format!(
                "can receive thread closed rx channel"
            ))),
        }
    }

    async fn send(&self, frame: CanFrame) {
        TCP_SINGLETON.send(self.bus_id, frame).await;
    }
}
