import {Box, Button, Stack} from "@mui/material";
import {invoke} from "@tauri-apps/api";
import TextField from "@mui/material/TextField";

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

interface EstablishConnectionProps {
    connectingPossible: boolean;
    setConnectingPossible: (isConnecting: boolean) => void;
    setConnectionSuccess: (isConnecting: boolean) => void;
    state: States,
    setState: (state: States) => void
}

export function emergency(setConnectingPossible: (isConnecting: boolean) => void, setState: (state: States) => void) {
    setState(States.Off)
    invoke('emergency');
    setConnectingPossible(true) //TODO Remove when unnecessary
}

export async function connect(setConnectingPossible: (isConnecting: boolean) => void, setConnectionSuccess: (connectionSuccess: boolean) => void) {
    try {
        await invoke("connect_pod");
        setConnectionSuccess(true)
    } catch (error) {
        // Success is false on default. Nothing to do.
    } finally {
        setConnectingPossible(false)
    }
}

export function prepare(state: States, setState: (state: States) => void) {
    if (state === States.Idle) {
        setState(States.LevitationPreparation)
        invoke('prepare_levitation');

    } else if (state === States.StableLevitation) {
        setState(States.LaunchPreparation)
        invoke("prepare_launch")
    }
}

export function levitate(setState: (state: States) => void) {
    setState(States.StartLevitation)
    invoke('levitate');
}

export function launch(setState: (state: States) => void) {
    setState(States.Acceleration)
    invoke('launch');
}

export function abort(state: States, setState: (state: States) => void) {
    if (state === States.StartLevitation) {
        setState(States.StopLevitation)
        invoke('abort_levitation');
    } else if (state === States.Acceleration) {
        setState(States.Brake)
        invoke('abort_acceleration')
    } //TODO other possible aborts and disable
}

function ControlBar({
                        connectingPossible,
                        setConnectingPossible,
                        setConnectionSuccess,
                        state,
                        setState
                    }: Readonly<EstablishConnectionProps>) {

    return (
        <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={3}
        >
            <Box
                component="form"
                sx={{
                    '& > :not(style)': {m: 1, width: '25ch'},
                }}
                noValidate
                autoComplete="off"
            >
                <TextField id="filled-basic" label="Current State" variant="filled" value={state.valueOf()} sx={{
                    input: {
                        background: "white"
                    }
                }} InputProps={{
                    readOnly: true,
                }}/>
            </Box>
            {/* Buttons */}
            <Button variant="contained" size="large"
                    style={{maxWidth: '170px', maxHeight: '57px', minWidth: '170px', minHeight: '57px'}}
                    sx={{backgroundColor: '#E32B10'}}
                    color="error"
                    onClick={() => {
                        emergency(setConnectingPossible, setState)
                    }}
            >Emergency [Space bar]</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '170px', maxHeight: '57px', minWidth: '170px', minHeight: '57px'}}
                    disabled={!connectingPossible}
                    onClick={() => {
                        connect(setConnectingPossible, setConnectionSuccess)
                    }}>Connect [F1]</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '170px', maxHeight: '57px', minWidth: '170px', minHeight: '57px'}}
                    disabled={!(state === States.Idle || state === States.StableLevitation)}
                    onClick={() => {
                        prepare(state, setState)
                    }}
            >Prepare [F2]</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '170px', maxHeight: '57px', minWidth: '170px', minHeight: '57px'}}
                    disabled={state !== States.ReadyToLevitate}
                    onClick={() => {
                        levitate(setState)
                    }}
            >Levitate [F3]</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '170px', maxHeight: '57px', minWidth: '170px', minHeight: '57px'}}
                    disabled={state !== States.ReadyToLaunch}
                    onClick={() => {
                        launch(setState)
                    }}
            >Launch [F4]</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '170px', maxHeight: '57px', minWidth: '170px', minHeight: '57px'}}
                    onClick={() => {
                        abort(state, setState)
                    }}
            >Abort [F5]</Button>
        </Stack>
    );
}

export default ControlBar;