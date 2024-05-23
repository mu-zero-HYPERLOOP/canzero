import Button from "@mui/material/Button";
import { ReactElement } from "react";


interface AppBarButtonProps {
  children: ReactElement,
  color: "stateError" | "stateIdle" | "statePrecharge"
  | "stateReady" | "stateStart" | "stateStop" 
  | "stateLevitation" | "stateRunning" | "stateManual" | "success",
  onClick: () => void,
  width?: number | string
  variant?: "outlined" | "contained" | "text",
  disabled? : boolean,
}

function AppBarButton({
  children,
  onClick,
  color,
  width = "15em",
  variant = "outlined",
  disabled = false,
}: Readonly<AppBarButtonProps>) {
  return (
    <Button
      variant={variant}
      size="small"
      disabled={disabled}
      style={{
        maxWidth: width,
        minWidth: width,
        fontSize: "0.5em",
        maxHeight: '57px',
        minHeight: '57px',
      }}
      color={color}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export default AppBarButton;
