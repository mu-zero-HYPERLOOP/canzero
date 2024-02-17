use crate::state::cnl_state::CNLState;

#[tauri::command]
pub async fn listen_to_node_latest(
    node_name: String,
    state: tauri::State<'_, CNLState>,
) -> Result<String, ()> {
    let cnl = state.lock().await;
    let node = cnl.nodes().iter().find(|no| no.name() == &node_name);
    let node = match node {
        Some(node) => node,
        None => return Err(()),
    };
    Ok(node.listen().await)
}

#[tauri::command]
pub async fn unlisten_from_node_latest(
    node_name : String,
    state : tauri::State<'_, CNLState>,
) -> Result<(),()> {
    let cnl = state.lock().await;
    let node = cnl.nodes().iter().find(|no| no.name() == &node_name);
    let node = match node {
        Some(node) => node,
        None => return Err(()),
    };
    Ok(node.unlisten().await)
}


