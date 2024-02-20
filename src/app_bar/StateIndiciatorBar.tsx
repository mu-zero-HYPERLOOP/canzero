import { PaletteColor, Skeleton, useTheme } from "@mui/material";


interface StateIndicatorBarProps {
  state?: string,
  voffset?: number | string
}

function StateIndicatorBar({ state, voffset = "0px" }: Readonly<StateIndicatorBarProps>) {
  const theme = useTheme();
  let color: PaletteColor;
  switch (state) {
    case "COM_DISCONNECTED":
      color = theme.palette.stateError;
      break;
    case "INIT":
      color = theme.palette.stateInit;
      break;
    case "IDLE":
      color = theme.palette.stateIdle;
      break;
    case "DISCONNECTING":
      color = theme.palette.stateIdle;
      break;
    case "PRECHARGE":
      color = theme.palette.statePrecharge;
      break;
    case "READY":
      color = theme.palette.stateReady;
      break;
    case "START_LEVITATION":
      color = theme.palette.stateStart;
      break;
    case "LEVITATION_STABLE":
      color = theme.palette.stateStart;
      break;
    case "START_GUIDANCE":
      color = theme.palette.stateStart;
      break;
    case "GUIDANCE_STABLE":
      color = theme.palette.stateLevitation;
      break;
    case "ACCELERATION":
      color = theme.palette.stateStart;
      break;
    case "CRUISING":
      color = theme.palette.stateRunning;
      break;
    case "DECELERATION":
      color = theme.palette.stateStop;
      break;
    case "STOP_LEVITATION":
      color = theme.palette.stateStop;
      break;
    default:
      color = theme.palette.stateError;
      break;
  }
  return (
    <Skeleton
      animation="pulse"
      variant="rectangular"
      sx={{
        position: "relative",
        top: voffset,
        padding: 0,
        margin: 0,
        borderRadius: 0,
        width: "100%",
        height: "5px",
        bgcolor: color.main
      }}
    />
  );
}

export default StateIndicatorBar;
