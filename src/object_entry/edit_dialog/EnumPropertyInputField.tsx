import { MenuItem, TextField } from "@mui/material";
import { useState } from "react";


interface EnumPropertyInputFieldProps {
  variants: string[],
  currentValue : string,
  onUpdate: (value: string) => void,
}


function EnumPropertyInputField({ variants, onUpdate , currentValue}: EnumPropertyInputFieldProps) {
  const [labelType, setLabelType] = useState<boolean>(true);
  return (
    <TextField
      sx={{width : "25ch"}}
      id="outlined-select-value"
      select={true}
      defaultValue=""
      label={labelType ? currentValue : "Select:"}
      onChange={(event) => {
        onUpdate(event.target.value);
      }}
      onFocus={() => {
        setLabelType(false);
      }}
      onBlur={() => {
        setLabelType(true);
      }}
    >
      {variants.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  )
}

export default EnumPropertyInputField;
