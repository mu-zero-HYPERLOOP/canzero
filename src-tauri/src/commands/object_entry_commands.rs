use serde::Serialize;

use crate::{state::cnl_state::CNLState, cnl::network::object_entry_object::ObjectEntryEvent};


#[derive(Clone, Serialize)]
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
    let cnl = state.lock().await;

    let Some(node) = cnl.nodes().iter().find(|no| no.name() == &node_name) else {
        return Err(());
    };
    let Some(object_entry_object) = node.object_entries().iter().find(|oe| oe.name() == &object_entry_name) else {
        return Err(());
    };
    object_entry_object.listen_to_latest();

    Ok(ObjectEntryListenLatestResponse{
        event_name : object_entry_object.latest_event_name().to_owned(),
        latest : object_entry_object.latest().await
    })
}

#[allow(unused)]
#[tauri::command]
pub async fn unlisten_from_latest_object_entry_value(
    state: tauri::State<'_, CNLState>,
    node_name : String,
    object_entry_name : String,
) -> Result<(), ()> {
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


#[derive(Clone, Serialize)]
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
) -> Result<ObjectEntryListenHistoryResponse, ()> {
    let cnl = state.lock().await;

    let Some(node) = cnl.nodes().iter().find(|no| no.name() == &node_name) else {
        return Err(());
    };
    let Some(object_entry_object) = node.object_entries().iter().find(|oe| oe.name() == &object_entry_name) else {
        return Err(());
    };
    object_entry_object.listen_to_history();

    Ok(ObjectEntryListenHistoryResponse {
        event_name : object_entry_object.history_event_name().to_owned(),
        history : object_entry_object.history().await,
    })
}

#[allow(unused)]
#[tauri::command]
pub async fn unlisten_from_history_of_object_entry(
    state: tauri::State<'_, CNLState>,
    node_name : String,
    object_entry_name : String,
) -> Result<(), ()> {
    let cnl = state.lock().await;

    let Some(node) = cnl.nodes().iter().find(|no| no.name() == &node_name) else {
        return Err(());
    };
    let Some(object_entry_object) = node.object_entries().iter().find(|oe| oe.name() == &object_entry_name) else {
        return Err(());
    };
    object_entry_object.unlisten_from_history().await;
    Ok(())
}

