use super::database::value::ObjectEntryValue;


pub trait ObjectEntryListener {

    fn notify(&self, value : &ObjectEntryValue);
}
