use std::sync::Arc;

use canzero_config::config::{message::MessageUsage, MessageRef, NetworkRef, SignalType};
use color_print::cprintln;
use gilrs::{Button, Event, Gilrs};

use super::tx::TxCom;

pub struct Gamepad {}

impl Gamepad {
    pub fn create(tx: &Arc<TxCom>, config: &NetworkRef) -> std::io::Result<Gamepad> {
        let gilrs = gilrs::Gilrs::new().map_err(|_| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Failed to initalize gilrs".to_owned(),
            )
        })?;

        let msg = config
            .messages()
            .iter()
            .find(|m| m.name() == "gamepad_stream_input");
        match msg {
            Some(msg) => {
                tokio::spawn(Self::gamepad_task(tx.clone(), gilrs, msg.clone()));
            }
            None => (),
        }

        Ok(Self {})
    }

    pub async fn gamepad_task(tx: Arc<TxCom>, mut gilrs: Gilrs, msg: MessageRef) {
        let MessageUsage::Stream(stream) = msg.usage() else {
            cprintln!(
                "<red>message {} is not a stream message. Disabling gamepad controller</red>",
                msg.name()
            );
            return;
        };
        let lt2_signal = msg
            .signals()
            .iter()
            .find(|s| s.name() == "value_name_lt2")
            .unwrap();
        let SignalType::Decimal {
            size,
            offset: lt2_offset,
            scale: lt2_scale,
        } = lt2_signal.ty()
        else {
            cprintln!(
                "<red>message {} ill formed. Disabling gamepad controller</red>",
                msg.name()
            );
            return;
        };
        assert_eq!(*size, 8);

        let rt2_signal = msg
            .signals()
            .iter()
            .find(|s| s.name() == "value_name_rt2")
            .unwrap();
        let SignalType::Decimal {
            size,
            offset: rt2_offset,
            scale: rt2_scale,
        } = rt2_signal.ty()
        else {
            cprintln!(
                "<red>message {} ill formed. Disabling gamepad controller</red>",
                msg.name()
            );
            return;
        };
        assert_eq!(*size, 8);

        let mut interval = tokio::time::interval(*stream.min_interval());
        let mut connected_count = 0usize;
        let mut left_trigger = 0f64;
        let mut right_trigger = 0f64;
        loop {
            interval.tick().await;
            // Examine new events
            while let Some(Event {
                id: _,
                event,
                time: _,
            }) = gilrs.next_event()
            {
                match event {
                    gilrs::EventType::Connected => {
                        cprintln!("<green>Gamepad connected</green>");
                        connected_count += 1;
                        if connected_count > 1 {
                            cprintln!("<yellow>Gamepad input will be ignored if more than one gamepad is connected</yellow>");
                        }
                    }
                    gilrs::EventType::Disconnected => {
                        cprintln!("<yellow>Gamepad disconnected</yellow>");
                        left_trigger = 0f64;
                        right_trigger = 0f64;
                        connected_count -= 1;
                    }
                    gilrs::EventType::ButtonChanged(button, value, _) => match button {
                        Button::LeftTrigger2 => {
                            left_trigger = value as f64;
                        }
                        Button::RightTrigger2 => {
                            right_trigger = value as f64;
                        }
                        _ => continue,
                    },
                    _ => continue,
                }
            }
            if connected_count == 1 {
                let mut data = [0u8; 8];
                data[0] = ((left_trigger - *lt2_offset) / *lt2_scale).round() as u8;
                data[1] = ((right_trigger - *rt2_offset) / *rt2_scale).round() as u8;
                tx.send_native(&msg, unsafe { std::mem::transmute(data) })
                    .await;
            }
        }
    }
}
