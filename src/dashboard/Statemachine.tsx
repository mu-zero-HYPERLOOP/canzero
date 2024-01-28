import {listen} from "@tauri-apps/api/event";
import {useEffect} from "react";

export enum States {
    Startup = 'Startup',
    Idle = "Idle",
    LevitationPreparation = 'Levitation Preparation',
    ReadyToLevitate = 'Ready to Levitate',
    StartLevitation = 'Start Levitation',
    StableLevitation = 'Stable Levitation',
    LaunchPreparation = 'Launch Preparation',
    ReadyToLaunch = 'Ready to Launch',
    Acceleration = 'Acceleration',
    Cruising = 'Cruising',
    Brake = 'Brake',
    StopLevitation = 'Stop Levitation',
    Rolling = 'Rolling',
    EndOfRun = 'End of Run',
    Off = 'Off'
}

interface StatemachineProps {
    setState: (state: States) => void
}

export default function Statemachine({setState}: Readonly<StatemachineProps>) {
    async function asyncPodStateListener() {
        return await listen<string>("pod-state", (event) => {
            console.log(event.payload)
            switch (event.payload) {
                case "startup": setState(States.Startup)
                    break
                case "idle": setState(States.Idle)
                    break
                case "levitation-preparation": setState(States.LevitationPreparation)
                    break
                case "ready-to-levitate": setState(States.ReadyToLevitate)
                    break
                case "start-levitation": setState(States.StartLevitation)
                    break
                case "stable-levitation": setState(States.StableLevitation)
                    break
                case "launch-preparation": setState(States.LaunchPreparation)
                    break
                case "ready-to-launch": setState(States.ReadyToLaunch)
                    break
                case "acceleration": setState(States.Acceleration)
                    break
                case "cruising": setState(States.Cruising)
                    break
                case "brake": setState(States.Brake)
                    break
                case "stop-levitation": setState(States.StopLevitation)
                    break
                case "rolling": setState(States.Rolling)
                    break
                case "end-of-run": setState(States.EndOfRun)
                    break
                case "off": setState(States.Off)
                    break

            }
        })
    }

    useEffect(() => {
        let unlisten = asyncPodStateListener();

        return () => {
            unlisten.then(f => f()).catch(console.error);
        }
    }, []);

    return <></>
}