use std::time::Duration;

use serde::Serialize;

use crate::{state::cnl_state::CNLState, cnl::network::object_entry_object::ObjectEntryEvent};


#[derive(Debug, Clone, Serialize)]
pub struct ObjectEntryListenLatestResponse {
    event_name : String,
    latest : Option<ObjectEntryEvent>,
}

#[allow(unused)]
#[tauri::command]
pub async fn listen_to_latest_object_entry_value(
    state: tauri::State<'_, CNLState>,
    node_name : String,
    object_entry_name : String,
) -> Result<ObjectEntryListenLatestResponse, ()> {
    println!("view invoked listen_to_latest_object_entry_value({node_name}, {object_entry_name})");
    let cnl = state.lock().await;

    let Some(node) = cnl.nodes().iter().find(|no| no.name() == &node_name) else {
        return Err(());
    };
    let Some(object_entry_object) = node.object_entries().iter().find(|oe| oe.name() == &object_entry_name) else {
        return Err(());
    };
    object_entry_object.listen_to_latest();

    let x = ObjectEntryListenLatestResponse{
        event_name : object_entry_object.latest_event_name().to_owned(),
        latest : object_entry_object.latest().await
    };

    Ok(x)
}

#[allow(unused)]
#[tauri::command]
pub async fn unlisten_from_latest_object_entry_value(
    state: tauri::State<'_, CNLState>,
    node_name : String,
    object_entry_name : String,
) -> Result<(), ()> {
    println!("view invoked unlisten_from_latest_object_entry_value({node_name}, {object_entry_name})");
    let cnl = state.lock().await;

    let Some(node) = cnl.nodes().iter().find(|no| no.name() == &node_name) else {
        return Err(());
    };
    let Some(object_entry_object) = node.object_entries().iter().find(|oe| oe.name() == &object_entry_name) else {
        return Err(());
    };
    object_entry_object.unlisten_from_latest().await;
    Ok(())
}


#[derive(Debug, Clone, Serialize)]
pub struct ObjectEntryListenHistoryResponse {
    event_name : String,
    history : Vec<ObjectEntryEvent>,
}

#[allow(unused)]
#[tauri::command]
pub async fn listen_to_history_of_object_entry(
    state: tauri::State<'_, CNLState>,
    node_name : String,
    object_entry_name : String,
    frame_size : u64,
    min_interval : u64,
) -> Result<ObjectEntryListenHistoryResponse, ()> {
    println!("view invoked listen_to_history_of_object_entry({node_name}, {object_entry_name}, {frame_size})");
    let frame_size = Duration::from_millis(frame_size);
    let min_interval = Duration::from_millis(min_interval);

    let cnl = state.lock().await;


    let Some(node) = cnl.nodes().iter().find(|no| no.name() == &node_name) else {
        println!("error during listen_to_history_of_object_entry");
        return Err(());
    };
    let Some(object_entry_object) = node.object_entries().iter().find(|oe| oe.name() == &object_entry_name) else {
        println!("error during listen_to_history_of_object_entry");
        return Err(());
    };
    let (event_name, history) = object_entry_object.listen_to_history(frame_size, min_interval).await;

    let x = ObjectEntryListenHistoryResponse {
        event_name,
        history,
    };

    Ok(x)
}

#[allow(unused)]
#[tauri::command]
pub async fn unlisten_from_history_of_object_entry(
    state: tauri::State<'_, CNLState>,
    node_name : String,
    object_entry_name : String,
    event_name : String,
) -> Result<(), ()> {
    println!("view invoked unlisten_from_history_object_entry({node_name}, {object_entry_name})");
    let cnl = state.lock().await;

    let Some(node) = cnl.nodes().iter().find(|no| no.name() == &node_name) else {
        return Err(());
    };
    let Some(object_entry_object) = node.object_entries().iter().find(|oe| oe.name() == &object_entry_name) else {
        return Err(());
    };
    object_entry_object.unlisten_from_history(&event_name).await;
    Ok(())
}

