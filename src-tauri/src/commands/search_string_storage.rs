use std::{collections::HashMap, sync::Mutex};
use tauri::State;

pub(crate) struct SearchStringStorage {
    pub(crate) store: Mutex<HashMap<String, String>>,
}


#[tauri::command]
pub fn get_stored_search_string(
    page: String,
    storage: State<SearchStringStorage>
) -> Result<String, ()> {
    let str = storage.store.lock().unwrap().remove(&page);
    if str.is_none() {
        Ok("".parse().unwrap())
    }
    else {
        Ok("".parse().unwrap()) // TODO return string
    }
}

#[tauri::command]
pub fn store_search_string(
    page: String,
    string: String,
    storage: State<SearchStringStorage>
) -> Result<(), ()> {
    storage.store.lock().unwrap().insert(page, string);
    Ok(())
}