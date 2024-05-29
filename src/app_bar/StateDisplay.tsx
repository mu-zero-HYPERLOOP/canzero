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
          width: "100px",
          height: "25px",
        },
      }}
      InputProps={{
        style: {
          fontSize: "0.5em"
        },
        readOnly: true,
        disableUnderline: true,
      }}
      InputLabelProps={{
        style :{
          fontSize: "1.2em"
        }
      }}
    />
  );


}
export default StateDisplay;
