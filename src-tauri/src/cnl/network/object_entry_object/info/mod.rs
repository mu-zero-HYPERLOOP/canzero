
use serde::Serialize;

use self::ty::ObjectEntryType;

pub mod ty;


// In typescript represented as types/ObjectEntryInformation
#[derive(Serialize, Clone)]
pub struct ObjectEntryInformation {
    name: String,
    description: Option<String>,
    id: u16,
    unit: Option<String>,
    ty : ObjectEntryType,
}

impl ObjectEntryInformation {
    pub fn new(name : String, description : Option<String>, 
               id : u16,
               unit : Option<String>,
               ty : ObjectEntryType) -> Self {
        Self {
            name,
            description,
            id,
            unit,
            ty,

        }
    }
}

