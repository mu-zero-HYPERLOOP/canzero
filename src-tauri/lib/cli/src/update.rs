use std::{net::IpAddr, str::FromStr};

use canzero_appdata::AppData;

use crate::{
    errors::{Error, Result},
    ssh::scan_ssh,
};

const CANZERO_CLI_REPO: &'static str = "https://github.com/mu-zero-HYPERLOOP/canzero-cli.git";
const CANZERO_CLI_PATH: &'static str = "canzero-cli";

const PI_ARCH: &'static str = "armv7-unknown-linux-gnueabihf";
const CANZERO_CLI_BIN_NAME: &'static str = "canzero-cli";

pub async fn command_update_server(
    host: Option<String>,
    reboot: bool,
    restart: bool,
    build: bool,
) -> Result<()> {
    let appdata = AppData::read()?;
    let Some(config_path) = appdata.get_config_path() else {
        return Err(Error::NoConfigSelected);
    };

    let mut canzero_cli_path = AppData::dir();
    canzero_cli_path.push(CANZERO_CLI_PATH);
    let canzero_cli_path = canzero_cli_path;

    let mut canzero_cli_bin_path = canzero_cli_path.clone();
    canzero_cli_bin_path.push("target");
    canzero_cli_bin_path.push(PI_ARCH);
    canzero_cli_bin_path.push("release");
    canzero_cli_bin_path.push(CANZERO_CLI_BIN_NAME);
    let canzero_cli_bin_path = canzero_cli_bin_path;

    if build {
        let Ok(rustup_target_list) = std::process::Command::new("rustup")
            .arg("target")
            .arg("list")
            .arg("--installed")
            .output()
        else {
            return Err(Error::MissingDependency("rustup".to_owned()));
        };
        let list = std::str::from_utf8(&rustup_target_list.stdout).unwrap();
        if !list.split('\n').any(|t| t == PI_ARCH) {
            println!(
                "Missing rust target {PI_ARCH}. 
Required for crosscompilation to raspberry pies!
Try installing it by running:
$ rustup target add {PI_ARCH}"
            );
        }

        // fetch canzero-cli repository
        println!("Downloading {CANZERO_CLI_REPO}");

        if canzero_cli_path.exists() {
            println!("Updaing {CANZERO_CLI_REPO}");
            if let Err(err) = std::process::Command::new("git")
                .arg("fetch")
                .current_dir(&canzero_cli_path)
                .spawn()
                .unwrap()
                .wait()
            {
                eprintln!("{err:?}");
            };
            if let Err(err) = std::process::Command::new("git")
                .arg("reset")
                .arg("--hard")
                .arg("origin/main")
                .current_dir(&canzero_cli_path)
                .spawn()
                .unwrap()
                .wait()
            {
                eprintln!("{err:?}");
            };
        } else {
            println!("Cloning {CANZERO_CLI_REPO}");
            std::process::Command::new("git")
                .arg("clone")
                .arg(CANZERO_CLI_REPO)
                .arg(&canzero_cli_path)
                .spawn()
                .unwrap()
                .wait()
                .unwrap();
        }

        println!("Cross-Compiling {CANZERO_CLI_REPO}");
        if let Err(err) = std::process::Command::new("cross")
            .arg("build")
            .arg("--release")
            .arg(&format!("--target={PI_ARCH}"))
            .arg("--features")
            .arg("socket-can")
            .current_dir(&canzero_cli_path)
            .spawn()
            .unwrap()
            .wait()
        {
            eprintln!("{err:?}");
        };
    } else {
        let ip_addr = if let Some(host) = host {
            IpAddr::from_str(&host).expect("Not a ip address!")
        } else {
            let Some(nd) = scan_ssh().await? else {
                return Ok(());
            };
            nd.server_addr
        };
        let mut config_files = appdata.config_files()?;
        config_files.push(config_path.clone());
        let config_dir = common_path::common_path_all(config_files.iter().map(|p| p.as_path()))
            .expect("Failed to find common network-config directory");

        // assumes that the main config file is the the common directory
        let relative_config_path = config_path.file_name().unwrap().to_str().unwrap();

        std::process::Command::new("ssh")
            .arg("-i")
            .arg("~/.ssh/mu-zero")
            .arg(format!("pi@{ip_addr:?}"))
            .arg("mkdir -p ~/.canzero")
            .spawn()
            .unwrap()
            .wait()
            .unwrap();

        // copy network config
        std::process::Command::new("ssh")
            .arg("-i")
            .arg("~/.ssh/mu-zero")
            .arg(format!("pi@{ip_addr:?}"))
            .arg("rm -rf ~/.canzero/network-config")
            .spawn()
            .unwrap()
            .wait()
            .unwrap();

        std::process::Command::new("scp")
            .arg("-i")
            .arg("~/.ssh/mu-zero")
            .arg("-r")
            .arg(config_dir)
            .arg(&format!("pi@{ip_addr:?}:/home/pi/.canzero/network-config"))
            .spawn()
            .unwrap()
            .wait()
            .unwrap();

        std::process::Command::new("ssh")
            .arg("-i")
            .arg("~/.ssh/mu-zero")
            .arg(format!("pi@{ip_addr:?}"))
            .arg("rm /home/pi/.canzero/canzero")
            .spawn()
            .unwrap()
            .wait()
            .unwrap();

        std::process::Command::new("scp")
            .arg("-i")
            .arg("~/.ssh/mu-zero")
            .arg(canzero_cli_bin_path)
            .arg(&format!("pi@{ip_addr:?}:/home/pi/.canzero/canzero"))
            .spawn()
            .unwrap()
            .wait()
            .unwrap();

        println!("Set config path on pi@{ip_addr:?} to /home/pi/.canzero/network-config/{relative_config_path}");
        std::process::Command::new("ssh")
            .arg("-i")
            .arg("~/.ssh/mu-zero")
            .arg(format!("pi@{ip_addr:?}"))
            .arg("sudo /home/pi/.canzero/canzero")
            .arg("config")
            .arg("set")
            .arg(&format!(
                "/home/pi/.canzero/network-config/{relative_config_path}"
            ))
            .spawn()
            .unwrap()
            .wait()
            .unwrap();

        if reboot {
            println!("Rebooting server");
            std::process::Command::new("ssh")
                .arg("-i")
                .arg("~/.ssh/mu-zero")
                .arg(format!("pi@{ip_addr:?}"))
                .arg("sudo")
                .arg("reboot")
                .spawn().unwrap().wait().unwrap();
        } else if restart {
            println!("Restarting server");
            std::process::Command::new("ssh")
                .arg("-i")
                .arg("~/.ssh/mu-zero")
                .arg(format!("pi@{ip_addr:?}"))
                .arg("sudo pkill canzero")
                .spawn()
                .unwrap()
                .wait()
                .unwrap();
            std::process::Command::new("ssh")
            .arg("-i")
            .arg("~/.ssh/mu-zero")
            .arg(format!("pi@{ip_addr:?}"))
            .arg("sudo /home/pi/.canzero/canzero server start >> /home/pi/.canzero/canzero-server.log 2>&1 &")
            .spawn().unwrap().wait().unwrap();
        }
    }

    Ok(())
}

pub fn command_update_self(socketcan: bool) -> Result<()> {
    let mut command = std::process::Command::new("cargo");
    command
        .arg("install")
        .arg("--git")
        .arg("https://github.com/mu-zero-HYPERLOOP/canzero-cli.git");
    if socketcan {
        println!("Enabling feature socket-can");
        command.arg("--features").arg("socket-can");
    }
    command.spawn().unwrap().wait().unwrap();

    Ok(())
}
