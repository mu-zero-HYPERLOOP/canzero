use std::sync::Arc;

use self::{
    database::{TraceDatabase, SortCriteria, SortOrder},
    frame::{CanErrorType, TraceFrame}, observable::TraceObservable,
};

use super::{
    can_adapter::{can_error::TCanError, can_frame::TCanFrame}, frame::TFrame
};

pub mod database;
pub mod event;
mod frame;
mod observable;

const TRACE_EVENT_NAME : &'static str = "trace";

pub struct TraceObject {
    database: Arc<TraceDatabase>,
    observable : TraceObservable,
}

impl TraceObject {
    pub fn create(app_handle: &tauri::AppHandle) -> Self {
        let database = Arc::new(TraceDatabase::new());
        Self {
            observable : TraceObservable::new(app_handle, TRACE_EVENT_NAME, &database),
            database,
        }
    }

    pub async fn push_undefined_frame(&self, undefined_frame: TCanFrame, bus_name : &str, bus_id : u32) {
        let (arrive_instant, can_frame) = undefined_frame.destruct();
        self.database
            .update(TraceFrame::Undefined(can_frame), arrive_instant, bus_name, bus_id)
            .await;
    }

    pub async fn push_error_frame(&self, error_frame: TCanError, bus_name : &str, bus_id : u32) {
        let (arrive_instant, can_error) = error_frame.destruct();
        let errors = match can_error {
            super::can_adapter::can_error::CanError::Io(_) => vec![CanErrorType::Internal],
            super::can_adapter::can_error::CanError::Disconnect(_) => vec![CanErrorType::Internal],
            super::can_adapter::can_error::CanError::Can(can_error_flag) => {
                let mut errs = vec![];
                if can_error_flag & 0x1 != 0 {
                    errs.push(CanErrorType::BitError);
                } else if can_error_flag & 0x2 != 0 {
                    errs.push(CanErrorType::BitStuffing);
                } else if can_error_flag & 0x4 != 0 {
                    errs.push(CanErrorType::FormError);
                } else if can_error_flag & 0x8 != 0 {
                    errs.push(CanErrorType::AckError);
                } else if can_error_flag & 0x8 != 0 {
                    errs.push(CanErrorType::CrcError);
                }
                errs
            }
        };
        for err in errors {
            self.database
                .update(TraceFrame::Error(err), arrive_instant, bus_name, bus_id)
                .await;
        }
    }

    pub async fn push_normal_frame(&self, frame: TFrame, bus_name : &str, bus_id : u32) {
        let (arrive_instant, frame) = frame.destruct();
        let trace_frame = TraceFrame::Frame(frame);
        self.database.update(trace_frame, arrive_instant, bus_name, bus_id).await;
    }

    pub async fn filter_by(&self, filter_string : Option<String>) {
        self.database.filter_by(filter_string).await;
    }

    pub async fn sort_by(&self, sort_by : SortCriteria, order : SortOrder) {
        self.database.sort_by(sort_by, order).await;
    }

    pub async fn listen(&self) -> &'static str{
        self.observable.listen().await
    }

    pub async fn unlisten(&self) {
        self.observable.unlisten().await
    }
}
