import { AppBar as MuiAppBar, AppBarProps as MuiAppBarProps, IconButton, Toolbar, styled, Stack, useTheme } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import { DRAWER_WIDTH } from "../side_menu/SideMenu";
import AppBarButton from "./AppBarButton";
import StateDisplay from "./StateDisplay";
import { useEffect, useState } from "react";
import { ObjectEntryListenLatestResponse } from "../object_entry/types/events/ObjectEntryListenLatestResponse";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { ObjectEntryEvent } from "../object_entry/types/events/ObjectEntryEvent";
import StateIndiciatorBar from "./StateIndiciatorBar";
import { sendAbortCommand, sendDisconnectCommand, sendEmergencyCommand, sendManualControlCommand, sendPrechargeCommand, sendStartLevitationCommand, sendStartPropulsionCommand, sendStopLevitationCommand, sendStopPropulsionCommand } from "./commands";

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: DRAWER_WIDTH,
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));


interface CustomAppBarProps {
  open: boolean,
  stateColor: string,
  toggleOpen: () => void,
}


const STATE_OE = { nodeName: "master", objectEntryName: "global_state" };

const START_45V_LABEL = <p>Start<br />45V-System [F1]</p>;
const STOP_45V_LABEL = <p>Stop<br />45V-System [F2]</p>;
const START_LEVI_LABEL = <p>Start<br />Levitation [F1]</p>;
const STOP_LEVI_LABEL = <p>Stop<br />Levitation [F2]</p>;
const START_PROP_LABEL = <p>Start<br />Propulsion [F1]</p>;
const STOP_PROP_LABEL = <p>Stop<br />Propulsion [F2]</p>;

interface CommandList {
  startCommandLabel: JSX.Element;
  disableStart: boolean,
  startCommand: () => void,
  stopCommandLabel: JSX.Element;
  disableStop: boolean,
  stopCommand: () => void,
  disableAbort: boolean,
  disableManual: boolean,

}

function CustomAppBar({ open, toggleOpen }: Readonly<CustomAppBarProps>) {

  const theme = useTheme();
  const [state, setState] = useState<string>("COM_DISCONNECTED");
  const [commandList, setCommandList] = useState<CommandList>({
    startCommandLabel : <p>Setting up</p>,
    disableStart : true,
    startCommand : () => {},
    stopCommandLabel : <p>Setting up</p>,
    disableStop :true,
    stopCommand : () => {},
    disableAbort : true,
    disableManual : true,
  });

  function updateState(state: string) {
    setState(state);

    let startCommandLabel: JSX.Element;
    let disableStart: boolean;
    let startCommand: () => void;
    let stopCommandLabel: JSX.Element;
    let disableStop: boolean;
    let stopCommand: () => void;

    let disableManual: boolean = true;
    let disableAbort: boolean = true;
    switch (state) {
      case "COM_DISCONNECTED":
      case "INIT":
        startCommandLabel = START_45V_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_45V_LABEL;
        disableStop = true;
        stopCommand = () => { };
        disableAbort = true;
        break;
      case "IDLE":
        startCommandLabel = START_45V_LABEL;
        disableStart = false;
        startCommand = sendPrechargeCommand;
        stopCommandLabel = STOP_45V_LABEL;
        disableStop = true;
        stopCommand = () => { };
        disableAbort = true;
        break;
      case "DISCONNECTING":
        startCommandLabel = START_45V_LABEL;
        disableStart = true;
        startCommand = sendPrechargeCommand;
        stopCommandLabel = STOP_45V_LABEL;
        disableStop = true;
        stopCommand = sendDisconnectCommand;
        disableAbort = true;
        break;
      case "PRECHARGE":
        startCommandLabel = START_45V_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_45V_LABEL;
        disableStop = false;
        stopCommand = sendDisconnectCommand;
        disableAbort = true;
        break;
      case "READY":
        startCommandLabel = START_LEVI_LABEL;
        disableStart = false;
        startCommand = sendStartLevitationCommand;
        stopCommandLabel = STOP_45V_LABEL;
        disableStop = false;
        stopCommand = sendDisconnectCommand;
        disableAbort = true;
        break;
      case "START_LEVITATION":
        startCommandLabel = START_LEVI_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_LEVI_LABEL;
        disableStop = false;
        stopCommand = sendStopLevitationCommand;
        disableAbort = false;
        break;
      case "LEVITATION_STABLE":
        startCommandLabel = START_LEVI_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_LEVI_LABEL;
        disableStop = false;
        stopCommand = sendStopLevitationCommand;
        disableAbort = false;
        break;
      case "START_GUIDANCE":
        startCommandLabel = START_LEVI_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_LEVI_LABEL;
        disableStop = false;
        stopCommand = sendStopLevitationCommand;
        disableAbort = false;
        break;
      case "GUIDANCE_STABLE":
        startCommandLabel = START_PROP_LABEL;
        disableStart = false;
        startCommand = sendStartPropulsionCommand;
        stopCommandLabel = STOP_LEVI_LABEL;
        disableStop = false;
        stopCommand = sendStopLevitationCommand;
        disableAbort = false;
        break;
      case "ACCELERATION":
        startCommandLabel = START_PROP_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_LEVI_LABEL;
        disableStop = false;
        stopCommand = sendStopPropulsionCommand;
        disableAbort = false;
        break;
      case "CRUISING":
        startCommandLabel = START_PROP_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_PROP_LABEL;
        disableStop = false;
        stopCommand = sendStopPropulsionCommand;
        disableAbort = false;
        break;
      case "DECELERATION":
        startCommandLabel = START_PROP_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_LEVI_LABEL;
        disableStop = true;
        stopCommand = () => { };
        disableAbort = false;
        break;
      case "STOP_LEVITATION":
        startCommandLabel = START_PROP_LABEL;
        disableStart = true;
        startCommand = () => { };
        stopCommandLabel = STOP_LEVI_LABEL;
        disableStop = true;
        stopCommand = () => { };
        disableAbort = false;
        break;
      default:
        startCommandLabel = <p>Emergency</p>;
        stopCommandLabel = <p>Emergency</p>;
        disableStop = false;
        disableStart = false;
        disableAbort = false;
        disableManual = true;
        startCommand = sendEmergencyCommand;
        stopCommand = sendEmergencyCommand;
    }
    setCommandList({
      startCommandLabel,
      disableStart,
      startCommand,
      stopCommandLabel,
      disableStop,
      stopCommand,
      disableManual,
      disableAbort
    });
  }

  useEffect(() => {
    async function asyncSetup() {

      const resp = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", STATE_OE);
      if (resp.latest !== undefined && resp.latest !== null) {
        updateState(resp.latest.value as string);
      }
      const unlistenJs = await listen<ObjectEntryEvent>(resp.event_name, event => {
        updateState(event.payload.value as string);
      });
      return () => {
        invoke("unlisten_from_latest_object_entry_value", STATE_OE).catch(console.error);
        unlistenJs();
      }
    }

    const asyncCleanup = asyncSetup();

    return () => {
      asyncCleanup.then(f => f()).catch(console.error);
    }
  }, []);

  useEffect(() => {
    const keyDownHandler = (event: { key: string; preventDefault: () => void; }) => {
      if (event.key === ' ') {
        event.preventDefault();
        sendEmergencyCommand();
      } else if (event.key === "F1") {
        event.preventDefault()
        if (commandList !== undefined && !commandList.disableStart) {
          commandList.startCommand();
        }
      } else if (event.key === "F2") {
        event.preventDefault()
        if (commandList !== undefined && !commandList.disableStop) {
          commandList.stopCommand();
        }
      } else if (event.key === "F3") {
        event.preventDefault()
        if (commandList !== undefined && !commandList.disableAbort) {
          sendAbortCommand();
        }
      } else if (event.key === "F4") {
        event.preventDefault()
        if (commandList !== undefined && !commandList.disableManual) {
          sendManualControlCommand();
        }
      }
    };
    document.addEventListener('keydown', keyDownHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
    };
  }, [commandList]);

  return (
    <AppBar
      position="absolute"
      open={open}
      sx={{
        backgroundColor: theme.palette.background.appBar,
        boxShadow: "none"
      }}

    >
      <Toolbar
        sx={{
          pr: '24px', // keep right padding when drawer closed
          height: "75px",
          boxShadow: "none",
        }}
      >
        {open ? <></> :
          <IconButton
            edge="start"
            aria-label="open drawer"
            onClick={toggleOpen}
            sx={{
              marginRight: '36px',
            }}
          >
            <MenuIcon />
          </IconButton>
        }
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={3}
        >
          <StateDisplay state={state} />
          {/* Buttons */}
          <AppBarButton variant="contained" color="stateError" onClick={sendEmergencyCommand} >
            <p>Emergency [Space bar]</p>
          </AppBarButton>

          <AppBarButton color="stateIdle" disabled={commandList.disableStart} onClick={commandList.startCommand} >
            {commandList.startCommandLabel}
          </AppBarButton>

          <AppBarButton color="stateError" disabled={commandList.disableStop} onClick={commandList?.stopCommand} >
            {commandList.stopCommandLabel}
          </AppBarButton>

          <AppBarButton color="stateError" disabled={commandList.disableAbort} onClick={sendAbortCommand} >
            <p>Abort [F3]</p>
          </AppBarButton>

          <AppBarButton color="success" disabled={commandList.disableManual} onClick={sendManualControlCommand} >
            <p>Manual [F4]</p>
          </AppBarButton>

        </Stack>
      </Toolbar>
      <StateIndiciatorBar state={state} />
    </AppBar>)
}

export default CustomAppBar;
