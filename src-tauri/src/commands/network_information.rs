use serde::Serialize;

use crate::state::cnl_state::CNLState;

// In typescript represented as types/NetworkInformation
#[derive(Serialize, Clone)]
pub struct NetworkInformation {
    baudrate: u32,
    node_names: Vec<String>,
}
#[tauri::command]
pub async fn network_information(
    state: tauri::State<'_, CNLState>,
) -> Result<NetworkInformation, ()> {
    let cnl = state.lock().await;
    Ok(NetworkInformation {
        baudrate: cnl.baudrate(),
        node_names: cnl.nodes().iter().map(|n| n.name().to_owned()).collect(),
    })
}

// In typescript represented as types/NodeInformation
#[derive(Serialize, Clone)]
pub struct NodeInformation {
    name: String,
    description: Option<String>,
    id: u16,
    object_entries: Vec<String>,
    commands: Vec<String>,
}

#[tauri::command]
pub async fn node_information(
    state: tauri::State<'_, CNLState>,
    node_name: String,
) -> Result<NodeInformation, String> {
    let cnl = state.lock().await;
    let node = cnl.nodes().iter().find(|n| n.name() == &node_name);
    match node {
        Some(node) => Ok(NodeInformation {
            name: node.name().to_owned(),
            description: node.description().cloned(),
            id: node.id(),
            object_entries: node
                .object_entries()
                .iter()
                .map(|oe| oe.name().to_owned())
                .collect(),
            commands: node
                .commands()
                .iter()
                .map(|c| c.name().to_owned())
                .collect(),
        }),
        None => Err(format!("node with name '{node_name}' doesn't exist")),
    }
}

// In typescript represented as types/ObjectEntryInformation
#[derive(Serialize, Clone)]
pub struct ObjectEntryInformation {
    name: String,
    description: Option<String>,
    id: u16,
    unit: Option<String>,
}

pub enum ObjectEntryType {
    Int,
    Uint,
    Real,
    Enum { entries : Vec<String>},
    Composite { 
        name : String, 
        attributes : Vec<(String, Box<ObjectEntryType>)>
    },
}

#[tauri::command]
pub async fn object_entry_information(
    state: tauri::State<'_, CNLState>,
    node_name: String,
    object_entry_name: String,
) -> Result<ObjectEntryInformation, String> {
    let cnl = state.lock().await;
    let node = cnl.nodes().iter().find(|n| n.name() == &node_name);
    let Option::Some(node) = node else {
        return Err(format!("node with name '{node_name}' doesn't exist"));
    };
    let object_entry = node
        .object_entries()
        .iter()
        .find(|oe| oe.name() == &object_entry_name);
    // determine ObjectEntryFormat

    match object_entry {
        Some(object_entry) => Ok(ObjectEntryInformation {
            name: object_entry_name,
            description: match object_entry.description() {
                Some(desc) => Some(desc.to_owned()),
                None => None,
            },
            id: object_entry.id() as u16, // <- object entry ids shoudl always be u16
            unit: match object_entry.unit() {
                Some(desc) => Some(desc.to_owned()),
                None => None,
            },
        }),
        None => Err(format!(
            "node '{node_name}' doesn't have a object entry with name '{object_entry_name}'"
        )),
    }
}

// In typescript represented as types/CommandInformation
#[derive(Serialize, Clone)]
pub struct CommandInformation {
    name: String,
    description: Option<String>,
}

#[tauri::command]
pub async fn command_information(
    state: tauri::State<'_, CNLState>,
    node_name: String,
    command_name: String,
) -> Result<CommandInformation, String> {
    let cnl = state.lock().await;
    let node = cnl.nodes().iter().find(|n| n.name() == &node_name);
    let Option::Some(node) = node else {
        return Err(format!("node with name '{node_name}' doesn't exist"));
    };
    let command = node.commands().iter().find(|c| c.name() == command_name);
    match command {
        Some(command) => Ok(CommandInformation {
            name: command_name,
            description: command.description().cloned(),
        }),
        None => Err(format!(
            "node '{node_name}' doesn't have a command with name '{command_name}'"
        )),
    }
}
