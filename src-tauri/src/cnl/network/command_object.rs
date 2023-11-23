use can_config_rs::config;

use crate::cnl::frame::type_frame::TypeValue;

pub struct CommandObject {
    command_ref: config::CommandRef,
}

impl CommandObject {
    pub fn create(command_config: &config::CommandRef, app_handle : &tauri::AppHandle) -> Self {
        Self {
            command_ref: command_config.clone(),
        }
    }
    pub fn name(&self) -> &str {
        self.command_ref.name()
    }
    pub fn description(&self) -> Option<&String> {
        self.command_ref.description()
    }
    pub fn build_invoke(&self) -> InvokeCommandBuilder {
        InvokeCommandBuilder::new(self)
    }
}

pub struct InvokeCommandBuilder<'a> {
    command_object: &'a CommandObject,
    arguments : Vec<(String, TypeValue)>,
}

impl<'a> InvokeCommandBuilder<'a> {
    pub fn new(command_object: &'a CommandObject) -> Self {
        InvokeCommandBuilder { 
            arguments : vec![],
            command_object 
        }
    }
    pub fn argument(&mut self, name: &str, value: TypeValue) {
        self.arguments.push((name.to_owned(), value));
    }
    pub fn invoke(self) {
        // TODO actually invoke the command req.
    }
}

enum CommandEvent {
    Resp,
    Req(u32),
    Timeout(u32),
}
