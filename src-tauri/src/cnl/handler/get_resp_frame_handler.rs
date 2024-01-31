use std::sync::Arc;

use can_config_rs::config;

use crate::cnl::{
    errors::{Result, Error},
    frame::{
        type_frame::{CompositeTypeValue, TypeValue, FrameType},
        Frame, TFrame,
    },
    network::NetworkObject,
    parser::type_frame_parser::TypeFrameParser, can_adapter::{TCanFrame, timestamped::Timestamped},
};

pub struct GetRespFrameHandler {
    parser: TypeFrameParser,
    network: Arc<NetworkObject>,
    get_resp_msg: config::MessageRef,
}

impl GetRespFrameHandler {
    pub fn create(
        network: &Arc<NetworkObject>,
        get_resp_msg: &config::MessageRef,
    ) -> Self {
        let parser = TypeFrameParser::new(get_resp_msg);
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
            network: network.clone(),
            get_resp_msg: get_resp_msg.clone(),
        }
    }

    fn parse_object_entry_value(
        data: &Bitstring,
        ty: &config::TypeRef,
        get_resp_msg: &config::MessageRef,
        start_bit: usize,
        end_bit: usize, //exclusive!!
    ) -> Result<(usize, TypeValue)> {

        match ty as &config::Type {
            config::Type::Primitive(signal_type) => match signal_type {
                config::SignalType::UnsignedInt { size } => {
                    let uvalue = data.read_at(start_bit, *size as usize)?;
                    Ok((*size as usize, TypeValue::Unsigned(uvalue)))
                }
                config::SignalType::SignedInt { size } => {
                    let uvalue = data.read_at(start_bit, *size as usize)?;
                    let svalue = unsafe { std::mem::transmute::<u64, i64>(uvalue) };
                    Ok((*size as usize, TypeValue::Signed(svalue)))
                }
                config::SignalType::Decimal {
                    size,
                    offset,
                    scale,
                } => {
                    let uvalue = data.read_at(start_bit, *size as usize)?;
                    let dvalue = uvalue as f64 * scale - offset;
                    Ok((*size as usize, TypeValue::Real(dvalue)))
                }
            },
            config::Type::Struct {
                name : _,
                description : _,
                attribs,
                visibility : _,
            } => {
                let mut size = 0;
                let mut start = start_bit;
                let mut attributes = vec![];
                for (attrib_name, attrib_type) in attribs {
                    let (attrib_size, attrib_value) = Self::parse_object_entry_value(data, attrib_type, get_resp_msg, start, end_bit)?;
                    start += attrib_size;
                    size += attrib_size;
                    attributes.push(FrameType::new(attrib_name.clone(), attrib_value));
                }
                Ok((size, TypeValue::Composite(CompositeTypeValue::new(
                    attributes,
                    ty,
                ))))
            }
            config::Type::Enum {
                name : _,
                description : _,
                size,
                entries,
                visibility : _,
            } => {
                let uvalue = data.read_at(start_bit, *size as usize)?;
                let entry = entries.iter().find(|e| e.1 == uvalue);
                let entry_name = match entry {
                    Some((entry_name, _value)) => entry_name.clone(),
                    None => "?".to_owned(),
                };
                Ok((*size as usize, TypeValue::Enum(ty.clone(), entry_name)))
            }
            config::Type::Array { len : _, ty : _ } => todo!(),
        }
    }

    // gets invoked in rx.rs -> fn can_receiver(..).
    // for each frame a lookup is done to get the correct handler afterwards.
    // This handler is only invoked for the get resp message of the config therefor the
    // format can be assumed to be the same for every frame!
    pub async fn handle(&self, can_frame: &TCanFrame) -> Result<TFrame> {
        // a small example of how to parse the type frame!
        let frame = self.parser.parse(can_frame)?;
        let Frame::TypeFrame(type_frame) = &frame else {
            return Err(Error::InvalidGetResponseFormat);
        };
        let TypeValue::Composite(composite) = type_frame.value()[0].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header"});
        };
        let TypeValue::Unsigned(sof) = composite.attributes()[0].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header.sof"});
        };
        let TypeValue::Unsigned(eof) = composite.attributes()[1].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header.eof"});
        };
        let TypeValue::Unsigned(toggle) = composite.attributes()[2].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header.toggle"});
        };
        let TypeValue::Unsigned(object_entry_id) = composite.attributes()[3].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header.object_entry_id"});
        };
        let TypeValue::Unsigned(_client_id) = composite.attributes()[4].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header.client_id"});
        };
        let TypeValue::Unsigned(server_id) = composite.attributes()[5].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header.server_id"});
        };
        let TypeValue::Unsigned(value) = type_frame.value()[1].value() else {
            return Err(Error::InvalidGetResponseFieldFormat{field : "header.value"});
        };
        assert_eq!(*sof, 1, "No Fragmentation supported yet");
        assert_eq!(*eof, 1, "No Fragmentation supported yet");
        assert_eq!(*toggle, 1, "No Fragmentation supported yet");

        // println!("object_entry_id = {object_entry_id}");

        // TODO lookup correct object entry!
        // this just selects a random one!
        let Some(server_node) = self.network.nodes().get(*server_id as usize) else {
            return Err(Error::InvalidGetResponseServerNotFound);
        };
        let Some(object_entry) = server_node.object_entries().get(*object_entry_id as usize) else {
            return Err(Error::InvalidGetResponseObjectEntryNotFound);
        };

        let mut bitstring = Bitstring::new(); //TODO probably good to implement fragmentation here!
        bitstring.append(unsafe { std::mem::transmute::<u32, [u8; 4]>(*value as u32) }.as_slice());

        let value = Self::parse_object_entry_value(
            &bitstring,
            object_entry.ty(),
            &self.get_resp_msg,
            0,
            bitstring.byte_len() * 8,
        )?;
        // println!("object_entry value = {value:?}");

        // notify the object entry (object) about the new value
        object_entry.push_value(value.1, can_frame.timestamp()).await;

        // has to return the parsed frame, because the frame is needed for the trace page!
        Ok(Timestamped::new(can_frame.timestamp().clone(), frame))
    }
}

struct Bitstring {
    bitstring: Vec<u8>,
}

impl Bitstring {
    pub fn new() -> Self {
        Self { bitstring: vec![] }
    }
    pub fn append(&mut self, bytes: &[u8]) {
        for byte in bytes {
            self.bitstring.push(*byte);
        }
    }
    pub fn byte_len(&self) -> usize {
        self.bitstring.len()
    }

    pub fn read_at(&self, bit_offset: usize, bit_size: usize) -> Result<u64> {
        let byte_offset = bit_offset / 8;
        let top_byte = (bit_offset + bit_size - 1) / 8;
        let bit_mod = bit_offset % 8;
        let size_mod = (bit_size + bit_offset) % 8;
        if self.bitstring.len() < (top_byte as usize) {
            return Err(Error::FragmentationError);
            //faild to read from bitstring at offset {bit_offset} and size {bit_size}
        }
        let mut bitslice = self.bitstring[byte_offset..=top_byte].to_vec();

        //rotate slice by bit_offset
        let bit_mod_mask = (0xFF as u8).overflowing_shr(9 - bit_mod as u32).0;
        for i in 0..bitslice.len() - 1 {
            bitslice[i] = bitslice[0].overflowing_shr(bit_mod as u32).0
                | (bitslice[i + 1] & bit_mod_mask)
                    .overflowing_shl(8 - bit_mod as u32)
                    .0;
        }
        let len = bitslice.len();
        bitslice[len - 1] = (bitslice[len - 1]
            & ((0xFF as u8).overflowing_shr(8 - size_mod as u32).0))
            .overflowing_shr(bit_mod as u32)
            .0;

        // construct u64 value
        let mut value: u64 = 0;
        for (i, byte) in bitslice.into_iter().enumerate() {
            // maybe endianess fucks my ass. not sure about that yet!
            value |= (byte as u64) << i * 8;
        }
        Ok(value)
    }
}

#[cfg(test)]
mod tests {
    use super::Bitstring;

    #[test]
    fn bitstring1() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(0, 7).unwrap();
        assert_eq!(value, 49);
    }

    #[test]
    fn bitstring2() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(1, 7).unwrap();
        assert_eq!(value, 24);
    }

    #[test]
    fn bitstring3() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(16, 8).unwrap();
        assert_eq!(value, 65);
    }

    #[test]
    fn bitstring4() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(22, 7).unwrap();
        assert_eq!(value, 69);
    }

    #[test]
    fn bitstring5() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(32, 8).unwrap();
        assert_eq!(value, 18);
    }

    #[test]
    fn bitstring6() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(42, 2).unwrap();
        assert_eq!(value, 0);
    }

    #[test]
    fn bitstring7() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(42, 3).unwrap();
        assert_eq!(value, 0);
    }

    #[test]
    fn bitstring8() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(42, 4).unwrap();
        assert_eq!(value, 8);
    }

    #[test]
    fn bitstring9() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(42, 5).unwrap();
        assert_eq!(value, 8);
    }
    #[test]
    fn bitstring10() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(42, 6).unwrap();
        assert_eq!(value, 8);
    }

    #[test]
    fn bitstring11() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        let value = bitstring.read_at(42, 7).unwrap();
        assert_eq!(value, 8 + 64);
    }

    #[test]
    fn bitstring_check_all_bits() {
        let mut bitstring = Bitstring::new();
        let v = 0xFF1231231417231;
        bitstring.append(unsafe { std::mem::transmute::<u64, [u8; 8]>(v) }.as_slice());
        for i in 0..64 {
            let mask: u64 = 1 << i;
            let result = mask & v != 0;
            let result = if result { 1 } else { 0 };
            assert_eq!(result, bitstring.read_at(i, 1).unwrap());
        }
    }
}
