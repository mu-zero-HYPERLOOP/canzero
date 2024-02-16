use gamepads::{Gamepads, Button};

pub struct ControllerInput {
    gamepads: Gamepads,
}

impl ControllerInput {
    pub fn new() -> Self {
        Self { gamepads: Gamepads::new() }
    }

    // Polls the gamepad for new events and processes them.
    pub fn poll(&mut self) -> Vec<(usize, Button)> {
        self.gamepads.poll();
        let mut events = Vec::new();

        for gamepad in self.gamepads.all() {
            for button in gamepad.all_currently_pressed() {
                events.push((gamepad.id().value() as usize, button));
            }
        }

        events
    }
}
