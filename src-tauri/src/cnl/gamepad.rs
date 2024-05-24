use std::{sync::Arc, time::Duration};

use gilrs::{Button, Event, GamepadId, Gilrs};

use super::tx::TxCom;

pub struct Gamepad {}

impl Gamepad {
    pub fn create(tx: &Arc<TxCom>) -> std::io::Result<Gamepad> {
        let gilrs = gilrs::Gilrs::new().map_err(|e| {
            std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Failed to initalize gilrs".to_owned(),
            )
        })?;

        tokio::spawn(Self::gamepad_task(tx.clone(), gilrs));
        Ok(Self {})
    }

    pub async fn gamepad_task(tx: Arc<TxCom>, mut gilrs: Gilrs) {
        let mut interval = tokio::time::interval(Duration::from_millis(100));
        let mut left_trigger = 0f32;
        let mut right_trigger = 0f32;
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
                    gilrs::EventType::ButtonChanged(button, value, _) => match button {
                        Button::LeftTrigger2 => {
                            left_trigger = value;
                        }
                        Button::RightTrigger2 => {
                            right_trigger = value;
                        }
                        _ => continue,
                    },
                    _ => continue,
                }
            }
            let mut accel = -left_trigger + right_trigger;
            println!("accel = {accel}");
        }
    }
}
