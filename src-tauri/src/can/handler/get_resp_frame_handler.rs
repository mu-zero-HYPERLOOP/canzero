use std::sync::Arc;

use can_config_rs::config;

use crate::can::{
    can_frame::CanFrame,
    frame::{type_frame::TypeValue, Frame},
    network::NetworkObject,
    parser::type_frame_parser::TypeFrameParser,
};

pub struct GetRespFrameHandler {
    parser: TypeFrameParser,
    network : Arc<NetworkObject>,
}

impl GetRespFrameHandler {
    pub fn create(parser: TypeFrameParser, network: &Arc<NetworkObject>) -> Self {
        // example of how to read a NetworkObject for ids!
        for node in network.nodes() {
            let _node_id = node.id();
            for object_entry in node.object_entries() {
                let _object_entry_id = object_entry.id();
                let _object_entry_name = object_entry.name();
            }
        }
        Self { 
            parser,
            network : network.clone(),
        }
    }

    fn parse_object_entry_value(data : u32, ty : &config::Type) -> TypeValue{
        // TODO implement parsing of object entry data into a TypeValue!

        TypeValue::Unsigned(0)
    }

    // gets invoked in rx.rs -> fn can_receiver(..).
    // for each frame a lookup is done to get the correct handler afterwards.
    // This handler is only invoked for the get resp message of the config therefor the
    // format can be assumed to be the same for every frame!
    pub fn handle(&self, frame: &CanFrame) -> Frame {
        // a small example of how to parse the type frame!
        let frame = self.parser.parse(frame);
        let Frame::TypeFrame(type_frame) = &frame else {
            panic!("GetRespFrameHandler invoked with the wrong message, can only be invoked for get respond messages");
        };
        //println!("{type_frame:?}");
        let TypeValue::Composite(composite) = type_frame.value()[0].value() else {
            panic!("invalid get resp message format");
        };
        let TypeValue::Unsigned(sof) = composite.attributes()[0].value() else {
            panic!("invalid get resp message format");
        };
        let TypeValue::Unsigned(eof) = composite.attributes()[1].value() else {
            panic!("invalid get resp message format");
        };
        let TypeValue::Unsigned(toggle) = composite.attributes()[2].value() else {
            panic!("invalid get resp message format");
        };
        let TypeValue::Unsigned(object_entry_id) = composite.attributes()[3].value() else {
            panic!("invalid get resp message format");
        };
        let TypeValue::Unsigned(client_id) = composite.attributes()[4].value() else {
            panic!("invalid get resp message format");
        };
        let TypeValue::Unsigned(server_id) = composite.attributes()[5].value() else {
            panic!("invalid get resp message format");
        };
        let TypeValue::Unsigned(value) = type_frame.value()[1].value() else {
            panic!("invalid get resp message format");
        };

        // TODO lookup correct object entry!
        // this just selects a random one!
        let oe = &self.network.nodes()[0].object_entries()[0];

        let ty = oe.ty(); // type of the object entry!
        let value = Self::parse_object_entry_value(*value as u32, ty);

        // notify the object entry (object) about the new value
        oe.push_value(value);

        // has to return the parsed frame, because the frame is needed for the trace page!
        frame
    }
}
