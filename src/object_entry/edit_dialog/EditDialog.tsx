
import { MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputAdornment,
  MenuItem,
  Modal,
  OutlinedInput,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import CreateIcon from "@mui/icons-material/Create";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import TextField from "@mui/material/TextField";
import { StructTypeInfo, Type } from "../types/Type.tsx";
import { Value } from "../types/Value.tsx";
import { ObjectEntryInformation } from "../types/ObjectEntryInformation.tsx";
import { ObjectEntryEvent } from "../types/events/ObjectEntryEvent.tsx";
import { ObjectEntryListenLatestResponse } from "../types/events/ObjectEntryListenLatestResponse.tsx";

const NEGATIVE: string = "Value must be positive"
const NON_INTEGER: string = "Value must be an integer"
const NOT_A_NUMBER: string = "Value is not a number"
//const OUT_OF_RANGE: string = "Value out of range"

function checkInput(val: string, type: Type, setError: (error: boolean) => void, setErrorMsg: (errorMsg: string | null) => void) {
  if (val === "" || type.id == "enum") {
    setError(false)
    return;
  } else if (type.id == "int") {
    let regExp = /^-?\d*[.]?\d+$/;
    let num = parseInt(val)
    if (!regExp.test(val)) setErrorMsg(NOT_A_NUMBER)
    else if (isNaN(num)) setErrorMsg(NOT_A_NUMBER)
    else if (val.includes(".")) setErrorMsg(NON_INTEGER)
    else {
      setError(false)
      return;
    }
  } else if (type.id = "uint") {
    let regExp = /^-?\d*[.]?\d+$/;
    let num = parseInt(val)
    if (!regExp.test(val)) setErrorMsg(NOT_A_NUMBER)
    else if (isNaN(num)) setErrorMsg(NOT_A_NUMBER)
    else if (val.includes(".")) setErrorMsg(NON_INTEGER)
    else if (num < 0) setErrorMsg(NEGATIVE)
    else {
      setError(false)
      return;
    }
  } else if (type.id = "real") {
    let regExp = /^-?\d*[.]?\d+$/;
    let num = parseFloat(val)
    if (!regExp.test(val)) setErrorMsg(NOT_A_NUMBER)
    else if (isNaN(num)) setErrorMsg(NOT_A_NUMBER)
    else {
      setError(false)
      return;
    }
  }
  setError(true)
}

function invokeBackend(node: string, objectEntry: string, val: Value, setGlobalError: {
  (value: SetStateAction<boolean>): void;
  (arg0: boolean): void;
}) {
  setGlobalError(false)
  invoke("set_object_entry_value", {
    nodeName: node,
    objectEntryName: objectEntry,
    newValueJson: JSON.stringify(val),
  }).catch((_) => setGlobalError(true));
}

function convertMutableObjectEntryValue(value: MutableObjectEntryValue, ty: Type): Value {
  if (ty.id == "struct") {
    let structInfo = ty.info as StructTypeInfo;
    // FIXME use structInfo instread of the type directly
    value = value as MutableObjectEntryComposite
    return {
      name: value.name, value: value.value.map((value: { name: string, value: MutableObjectEntryValue }, index) => {
        return ({ name: value.name, value: convertMutableObjectEntryValue(value.value, ty.attributes[index].type) })
      })
    }
  } else if (ty.id == "int" || ty.id == "uint" || ty.id == "real") {
    return (value as MutableRefObject<number>).current
  } else {
    return (value as MutableRefObject<string>).current
  }
}

function updateMutableObjectEntryValue(newValue: MutableObjectEntryValue, value: Value, ty: Type): Value {
  if (ty.id == "struct") {
    let structInfo = ty.info as StructTypeInfo;
    // FIXME
    newValue = newValue as MutableObjectEntryComposite
    return {
      name: newValue.name, value: newValue.value.map((current: { name: string, value: MutableObjectEntryValue }, index) => {
        return ({ name: current.name, value: updateMutableObjectEntryValue(current.value, (value as ObjectEntryComposite).value[index].value, ty.attributes[index].type) })
      })
    }
  } else if (ty.id == "int" || ty.id == "uint" || ty.id == "real") {
    return isNaN((newValue as MutableRefObject<number>).current) ? value : (newValue as MutableRefObject<number>).current
  } else {
    return (newValue as MutableRefObject<string>).current === "" ? value : (newValue as MutableRefObject<string>).current
  }
}

function sendInput(node: string, objectEntry: string, type: Type, value: ObjectEntryEvent | null, newValue: MutableObjectEntryValue, setGlobalError: {
  (value: SetStateAction<boolean>): void;
  (arg0: boolean): void;
}) {
  if (!value) {
    invokeBackend(node, objectEntry, convertMutableObjectEntryValue(newValue, type), setGlobalError)
  } else {
    invokeBackend(node, objectEntry, updateMutableObjectEntryValue(newValue, value.value, type), setGlobalError)
  }
}

interface DisplayTextFieldsProps {
  ty: Type,
  unit?: string,
  value: Value | undefined,
  newValue: MutableObjectEntryValue,
  name?: string,
  localErrors: boolean[],
  setLocalErrors: (localError: boolean[]) => void,
}

function DisplayTextFields({ ty, unit, value, newValue, name, localErrors, setLocalErrors }: Readonly<DisplayTextFieldsProps>) {
  let [errorMsg, setErrorMsg] = useState<string | null>(null)
  let [error, setError] = useState<boolean>(false)

  let endAdornment = unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined;
  let startAdornment = name ? <InputAdornment position="start">{name}</InputAdornment> : undefined;

  if (ty.id == "enum") {
    return (
      <FormControl sx={{ width: '25ch' }} variant="outlined">
        <FormHelperText id="outlined-weight-helper-text1">
          {'Set Value:'}
        </FormHelperText>
        <TextField
          id="outlined-select-value"
          select
          label="Select:"
          placeholder={value ? `${String(value)}` : undefined}
          onAnimationStart={() => setError(false)}
          onChange={(event) => {
            (newValue as MutableRefObject<string>).current = event.target.value
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">{name}</InputAdornment>,
          }}
        >
          {ty.map((option) => (
            //FIXME
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </FormControl>
    )
  } else if (ty.id == "struct") {
    let structInfo = ty.info as StructTypeInfo;
    // FIXME
    (newValue as MutableObjectEntryComposite).value.forEach(function(newVal, index) {
      if (value) {
        return <DisplayTextFields ty={ty.attributes[index].type} unit={unit} value={(value as ObjectEntryComposite).value[index].value} newValue={newVal.value} name={ty.name} localErrors={localErrors} setLocalErrors={setLocalErrors} />
      } else {
        return <DisplayTextFields ty={ty.attributes[index].type} unit={unit} value={value} newValue={newVal.value} name={ty.name} localErrors={localErrors} setLocalErrors={setLocalErrors} />
      }
    })


  } else {
    localErrors.push(error)
    setLocalErrors(localErrors)
    return (
      <FormControl sx={{ width: '25ch' }} variant="outlined">
        <FormHelperText id="outlined-weight-helper-text1">
          {error ? errorMsg : 'Set Value:'}
        </FormHelperText>
        <OutlinedInput
          placeholder={value ? `${Number(value)}` : undefined}
          id="outlined-adornment-weight1"
          endAdornment={endAdornment}
          aria-describedby="outlined-weight-helper-text1"
          inputProps={{
            'aria-label': 'weight',
          }}
          onAnimationStart={() => setError(false)}
          onChange={(event) => {
            checkInput(event.target.value, ty, setError, setErrorMsg);
            (newValue as MutableRefObject<number>).current = parseInt(event.target.value)
          }}
          startAdornment={startAdornment}
          error={error}
        />
      </FormControl>
    )
  }

}

const dialogStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

interface EditDialogProps {
  open: boolean,
  onClose: () => void,
  nodeName: string,
  objectEntryName: string
  objectEntryInfo: ObjectEntryInformation,
}

type MutableObjectEntryValue = MutableRefObject<number> | MutableRefObject<string> | MutableObjectEntryComposite;
interface MutableObjectEntryComposite {
  name: string; // redundant!
  value: { name: string, value: MutableObjectEntryValue }[],
}

function createInitial(ty: Type): MutableObjectEntryValue {
  if (ty.id == "struct") {
    let structInfo = ty.info as StructTypeInfo;
    return {
      name: structInfo.name,
      // FIXME Karl fucked up the interface Sorry =^).
      value: structInfo.attributes.map((value: { name: string, type: Type }) => {
        return ({ name: value.name, value: createInitial(value.type) })
      })
    }
  } else if (ty.id == "int" || ty.id == "uint" || ty.id == "real") {
    return useRef<number>(NaN)
  } else {
    return useRef<string>("")
  }
}

function isInitial(ty: Type, newValue: MutableObjectEntryValue): boolean {
  if (ty.id == "int" || ty.id == "uint" || ty.id == "real") {
    return isNaN((newValue as MutableRefObject<number>).current)
  } else if (ty.id == "enum") {
    return (newValue as MutableRefObject<string>).current === ""
  } else {
    return !(newValue as MutableObjectEntryComposite).value.map((value, index) => isInitial(ty.attributes[index].type, value.value)).includes(false)
  }
}

function EditDialog({ onClose, open, nodeName, objectEntryName, objectEntryInfo }: Readonly<EditDialogProps>) {
  let [value, setValue] = useState<ObjectEntryEvent | null>(null);
  let [globalError, setGlobalError] = useState<boolean>(false);
  let [localErrors, setLocalErrors] = useState<boolean[]>([])
  let newValue: MutableObjectEntryValue = createInitial(objectEntryInfo.ty)

  async function registerListener() {
    let { event_name, latest } = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value",
      { nodeName, objectEntryName });
    setValue(latest);

    let unlistenBackend = () => invoke("unlisten_from_latest_object_entry_value", {
      nodeName,
      objectEntryName
    }).catch(console.error);

    let unlistenReact = await listen<ObjectEntryEvent>(event_name, event => setValue(event.payload));

    return () => {
      unlistenBackend();
      unlistenReact();
    }
  }

  useEffect(() => {
    if (open) {
      let cleanup = registerListener();
      return () => {
        cleanup.then(f => f()).catch(console.error);
        setValue(null);
      }
    }
  }, [nodeName, objectEntryName, open]);

  return <Modal
    open={open}
    onClose={onClose}>
    <Paper sx={{ ...dialogStyle }}>
      <Stack direction="column" spacing={2} ml={2} mr={2}>
        <Stack direction="row" sx={{
          position: "relative",
          left: "-20px",
        }}>
          <Typography fontWeight={20} sx={{ marginRight: "8px" }}>
            <strong>Edit:</strong>
          </Typography>
          <Typography>
            {`${objectEntryInfo.name} of ${nodeName}`}
          </Typography>
        </Stack>
        <DisplayTextFields ty={objectEntryInfo.ty} unit={objectEntryInfo.unit} value={value?.value}
          newValue={newValue} localErrors={localErrors} setLocalErrors={setLocalErrors} />
        <Box component="form"
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="outlined"
            sx={{
              marginLeft: "auto",
            }}
            // TODO: proper error message maybe red box
            color={globalError ? "error" : "primary"}
            disabled={isInitial(objectEntryInfo.ty, newValue) || localErrors.includes(true)}
            onClick={() => {
              sendInput(nodeName, objectEntryName, objectEntryInfo.ty, value, newValue, setGlobalError)
            }}
          >
            Upload
          </Button>
        </Box>
      </Stack>
    </Paper>
  </Modal>
}

export default EditDialog;
