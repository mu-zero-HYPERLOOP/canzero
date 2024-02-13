use crate::{
    cnl::trace::database::{SortCriteria, SortOrder},
    state::cnl_state::CNLState,
};

#[tauri::command]
pub async fn listen_to_trace(state: tauri::State<'_, CNLState>) -> Result<String, ()> {
    Ok(state.lock().await.trace().listen().await.to_owned())
}

#[tauri::command]
pub async fn unlisten_from_trace(state: tauri::State<'_, CNLState>) -> Result<(), ()> {
    state.lock().await.trace().unlisten().await;
    Ok(())
}

#[tauri::command]
pub async fn sort_trace_by(
    state: tauri::State<'_, CNLState>,
    criteria: Option<String>,
    sort_asc: bool,
) -> Result<(), String> {
    let sort_by = match criteria {
        Some(criteria) => {
            if criteria == "id" {
                SortCriteria::ById
            } else if criteria == "absolute-time" {
                SortCriteria::ByAbsoluteTime
            } else if criteria == "delta-time" {
                SortCriteria::ByDeltaTime
            } else if criteria == "name" {
                SortCriteria::ByName
            } else if criteria == "dlc" {
                SortCriteria::ByDlc
            } else if criteria == "bus" {
                SortCriteria::ByBus
            }else {
                return Err(format!("invalid sort criteria {criteria}"));
            }
        }
        None => SortCriteria::None,
    };
    let order = if sort_asc {
        SortOrder::Asc
    } else {
        SortOrder::Desc
    };
    state.lock().await.trace().sort_by(sort_by, order).await;
    Ok(())
}

#[tauri::command]
pub async fn filter_trace_by(
    state: tauri::State<'_, CNLState>,
    filter_string: Option<String>,
) -> Result<(), ()> {
    state.lock().await.trace().filter_by(filter_string).await;
    Ok(())
}
