use crate::state::cnl_state::CNLState;

#[tauri::command]
pub async fn get_stored_search_string(
    state: tauri::State<'_, CNLState>,
    page: String,
) -> Result<String, ()> {
    Ok("".parse().unwrap())
}

#[tauri::command]
pub async fn store_search_string(
    state: tauri::State<'_, CNLState>,
    page: String,
    string: String
) -> Result<(), ()> {
    Ok(())
}