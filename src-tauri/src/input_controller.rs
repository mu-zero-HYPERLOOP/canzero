use gamepads::{Gamepad, Gamepads, GamepadId, Button};
use std::time::Duration;
use std::thread;

pub struct Controller {
    gamepads: Gamepads,
}

impl Controller {
    pub fn new() -> Self {
        let gamepads = Gamepads::new(); // Assuming this does not fail
        Controller { gamepads }
    }

    pub fn read_input(&mut self) {
        loop {
            self.gamepads.poll();

            for gamepad in self.gamepads.all() { 
                println!("Gamepad id: {:?}", gamepad.id());
                for button in gamepad.all_currently_pressed() {
                    println!("Pressed button: {:?}", button);
                }
                println!("Left thumbstick: {:?}", gamepad.left_stick());
                println!("Right thumbstick: {:?}", gamepad.right_stick());
            }

            thread::sleep(Duration::from_millis(500)); 
        }
    }
}
