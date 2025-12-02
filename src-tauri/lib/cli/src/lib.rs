use std::path::PathBuf;

use build_time::build_time_local;
use clap::{Parser, Subcommand};
use config::command_config_get;

use crate::{
    config::{
        command_config_check, command_config_hash, command_config_messages_list,
        command_config_nodes_list, command_config_object_entries_list, command_config_set,
        command_config_show,
    },
    dump::command_dump,
    generate::command_generate,
    scan::command_scan,
    server::command_server,
    status::command_status,
};

mod utils;
mod config;
mod dump;
mod errors;
mod generate;
mod scan;
mod server;
mod status;

#[derive(Parser, Debug)]
#[command(version, about = "Canzero is a CAN toolchain for fast prototyping")]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand, Debug)]
enum Command {
    #[command(
        about = "Display and select the current network configuration.",
        arg_required_else_help = true
    )]
    Config {
        #[command(subcommand)]
        command: ConfigCommand,
    },
    #[clap(alias = "gen")]
    #[command(about = "Generate c code from the selected network configuration.")]
    Generate {
        node_name: String,
        output_dir: PathBuf,
    },
    #[command(about = "Start canzero graphical user interface.")]
    Gui,
    #[command(about = "Interact with or start the server node.")]
    Server {
        #[command(subcommand)]
        command: ServerCommand,
    },
    #[command(about = "Print the CAN trace to the control.")]
    Dump {
        port: Option<u16>,
        #[clap(alias = "msg")]
        #[arg(short, long, num_args=0..)]
        messages: Vec<String>,
        #[clap(alias = "id")]
        #[arg(short, long, num_args=0..)]
        ids: Vec<String>,
    },
    #[command(about = "Check the status of all connected nodes.")]
    Status {
        port: Option<u16>,
    },
    Version,
}

#[derive(Subcommand, Debug)]
enum ConfigCommand {
    #[command(
        about = "Set path to network configuration.",
        arg_required_else_help = true
    )]
    Set {
        path: PathBuf,
    },
    #[command(
        about = "Display the network configuration.",
        arg_required_else_help = false
    )]
    Show {
        #[command(subcommand)]
        command: Option<ConfigShowCommand>,
    },
    #[command(
        about = "Check the network configuration for errors.",
        arg_required_else_help = false
    )]
    Check,
    Where,
}

#[derive(Subcommand, Debug)]
enum ConfigShowCommand {
    Hash,
    Messages {
        #[arg(short, long)]
        node: Option<String>,
        #[arg(short, long)]
        bus: Option<String>,
    },
    Nodes,
    ObjectEntries {
        node: String,
    },
}

#[derive(Subcommand, Debug)]
enum ServerCommand {
    Start { port: Option<u16> },
    Scan { port: Option<u16> },
}

/// returns true iff. the gui should be started!
pub async fn run_cli() -> bool {
    let cli = Cli::parse();
    let res = match cli.command {
        Some(cmd) => match cmd {
            Command::Config { command } => match command {
                ConfigCommand::Set { path } => command_config_set(path),
                ConfigCommand::Show { command } => match command {
                    Some(config_show_command) => match config_show_command {
                        ConfigShowCommand::Hash => command_config_hash(),
                        ConfigShowCommand::Messages { node, bus } => {
                            command_config_messages_list(node, bus)
                        }
                        ConfigShowCommand::Nodes => command_config_nodes_list(),
                        ConfigShowCommand::ObjectEntries { node } => {
                            command_config_object_entries_list(node)
                        }
                    },
                    None => command_config_show(),
                },
                ConfigCommand::Check => command_config_check(),
                ConfigCommand::Where => command_config_get(),
            },
            Command::Generate {
                node_name,
                output_dir,
            } => command_generate(&node_name, &output_dir),
            Command::Gui => return true,
            Command::Server { command } => match command {
                ServerCommand::Start { port } => command_server(port).await,
                ServerCommand::Scan { port } => command_scan(port).await,
            },
            Command::Dump { port, messages, ids } => command_dump(port, messages, ids).await,
            Command::Status {port} => command_status(port).await,
            Command::Version => {
                println!("build-time : {}", build_time_local!());
                if cfg!(feature = "socket-can") {
                    println!("socket-can : enabled");
                } else {
                    println!("socket-can : disabled");
                }
                Ok(())
            }
        },
        None => return true,
    };
    if let Err(err) = res {
        eprintln!("{err:?}");
    }
    return false;
}
