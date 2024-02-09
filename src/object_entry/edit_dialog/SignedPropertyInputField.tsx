import { FormControl, FormHelperText, OutlinedInput } from "@mui/material";
import { useState } from "react";


function parseInputToNumber(input : string) : number | null {
  let regex = /^-?[0-9]+$/;
  if (!regex.test(input)) {
    return null;
  }
  return Number(input);
}

function checkInputForErrors(min: number, max : number, input : string) : string | null {
  let inputAsNumber = Number(input);
  if (isNaN(inputAsNumber)) {
    return "Input has to be a number!";
  }
  if (inputAsNumber < min) {
    return `Input has to be greater than ${min}!`;
  }
  if (inputAsNumber > max) {
    return `Input has to be less than ${max}!`;
  }
  return null;
}


interface SignedPropertyInputFieldProps {
  min: number,
  max: number,
  currentValue? : number,
  onUpdate: (value: number | null | undefined) => void,
}

function SignedPropertyInputField({ min, max, onUpdate, currentValue }: SignedPropertyInputFieldProps) {
  const [input, setInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  return <FormControl sx={{ width: '25ch' }} variant="outlined">
    <FormHelperText id="outlined-weight-helper-text1">
      {errorMsg ?? 'Set Value:'}
    </FormHelperText>
    <OutlinedInput
      placeholder={currentValue?.toString()} 
      id="outlined-adornment-weight1"
      // endAdornment={endAdornment} TODO units
      aria-describedby="outlined-weight-helper-text1"
      inputProps={{
        'aria-label': 'weight',
      }}
      onAnimationStart={() => setErrorMsg(null)}
      onChange={(event) => {
        const input = event.target.value;
        // NOTE special case for the empty string
        if (input.length === 0) {
          setInput(input);
          onUpdate(undefined);
          return;
        }
        if (input == "-") {
          setInput(input);
          setErrorMsg("Not a valid number");
          return;
        }

        const number = parseInputToNumber(input);
        if (number !== null) {
          // NOTE input is a number!
          const error = checkInputForErrors(min, max, input);
          if (error) {
            setErrorMsg(error);
            onUpdate(null); // notify parent abount invalid value!
          }else {
            setErrorMsg(null);
            onUpdate(number); // notify parent about new value!
          }
          setInput(input);
        }else{ 
          // NOTE input is not a number, dont update the text!
        }
      }}
      value={input}
      error={errorMsg != null}
    />
  </FormControl>
}

export default SignedPropertyInputField;
