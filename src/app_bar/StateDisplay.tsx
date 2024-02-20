import { TextField } from "@mui/material";


interface StateDisplayProps {
  state: string,
}

function StateDisplay({ state }: Readonly<StateDisplayProps>) {
  return (
    <TextField
      id="state-display-button"
      label="Current State"
      variant="filled"
      value={state}
      sx={{
        input: {
          background: "white",
          width: "200px",
        },
      }}
      InputProps={{
        readOnly: true,
        disableUnderline: true,
      }}
    />
  );


}
export default StateDisplay;
