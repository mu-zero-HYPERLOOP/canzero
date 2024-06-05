use crate::state::cnl_state::CNLState;

#[tauri::command]
pub async fn get_stored_search_string(
    state: tauri::State<'_, CNLState>,
    page: String,
) -> Result<String, ()> {
    /* TODO return string from lookup table with key page.
        If present delete entry else return empty string.
    */
    Ok("".parse().unwrap())
}

#[tauri::command]
pub async fn store_search_string(
    state: tauri::State<'_, CNLState>,
    page: String,
    string: String
) -> Result<(), ()> {
    // TODO save page: string in a lookup table
    Ok(())
}