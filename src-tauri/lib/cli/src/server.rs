
use canzero_appdata::AppData;
use canzero_server::Server;

use crate::errors::Result;

pub async fn command_server(port : Option<u16>) -> Result<()> {

    let appdata = AppData::read()?;
    let network_config = appdata.config()?;
    let server = Server::create(network_config, port.unwrap_or(9002)).await?;

    server.start();
    loop {
        tokio::task::yield_now().await;
    }
}
