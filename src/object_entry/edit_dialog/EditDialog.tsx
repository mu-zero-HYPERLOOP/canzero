
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
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import TextField from "@mui/material/TextField";
import {EnumTypeInfo, isEnum, isInt, isReal, isStruct, isUInt, StructTypeInfo, Type} from "../types/Type.tsx";
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
  } else if (isInt(type.id)) {
    let regExp = /^-?\d*[.]?\d+$/;
    let num = parseInt(val)
    if (!regExp.test(val)) setErrorMsg(NOT_A_NUMBER)
    else if (isNaN(num)) setErrorMsg(NOT_A_NUMBER)
    else if (val.includes(".")) setErrorMsg(NON_INTEGER)
    else {
      setError(false)
      return;
    }
  } else if (isUInt(type.id)) {
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
  } else if (isReal(type.id)) {
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
  invoke("set_object_entry_value", {
    nodeName: node,
    objectEntryName: objectEntry,
    newValueJson: JSON.stringify(val),
  }).catch((_) => setGlobalError(true));
}

function convertMutableObjectEntryValue(value: MutableValue, ty: Type): Value {
  if (isStruct(ty.id)) {
    value = value as {[name : string] : MutableValue}
    let updated: {[name : string] : Value} = {}

    Object.entries(value).forEach(function ([name, curVal]) {
      updated[name] = convertMutableObjectEntryValue(curVal, (ty.info as StructTypeInfo).attributes[name])
    })
    return updated

  } else if (isInt(ty.id) || isUInt(ty.id) || isReal(ty.id)) {
    return (value as MutableRefObject<number>).current
  } else {
    return (value as MutableRefObject<string>).current
  }
}

function updateMutableObjectEntryValue(newValue: MutableValue, value: Value, ty: Type): Value {
  if (isStruct(ty.id)) {
    newValue = newValue as {[name : string] : MutableValue}
    let updated: {[name : string] : Value} = {}

    Object.entries(newValue).forEach(function ([name, mutValue]) {
      updated[name] = updateMutableObjectEntryValue(mutValue, (value as {[name : string] : Value})[name], (ty.info as StructTypeInfo).attributes[name])
    })
    return updated

  } else if (isInt(ty.id) || isUInt(ty.id) || isReal(ty.id)) {
    return isNaN((newValue as MutableRefObject<number>).current) ? value : (newValue as MutableRefObject<number>).current
  } else {
    return (newValue as MutableRefObject<string>).current === "" ? value : (newValue as MutableRefObject<string>).current
  }
}

function sendInput(node: string, objectEntry: string, type: Type, value: ObjectEntryEvent | null, newValue: MutableValue, setGlobalError: {
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
  newValue: MutableValue,
  name?: string,
  localErrors: boolean[],
  setLocalErrors: (localError: boolean[]) => void,
  setGlobalError: (globalError: boolean) => void,
}

function DisplayTextFields({ ty, unit, value, newValue, name, localErrors, setLocalErrors, setGlobalError }: Readonly<DisplayTextFieldsProps>) : JSX.Element |JSX.Element[] {
  let [errorMsg, setErrorMsg] = useState<string | null>(null)
  let [error, setError] = useState<boolean>(false)

  let endAdornment = unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined;
  let startAdornment = name ? <InputAdornment position="start">{name + ": "}</InputAdornment> : undefined;

  if (isEnum(ty.id)) {
    return (
      <FormControl sx={{ width: '25ch' }} variant="outlined">
        <FormHelperText id="outlined-weight-helper-text1">
          {' '}
        </FormHelperText>
        <TextField
          id="outlined-select-value"
          select
          label="Select:"
          placeholder={value ? `${String(value)}` : undefined} // TODO default value
          onAnimationStart={() => setError(false)}
          onChange={(event) => {
            (newValue as MutableRefObject<string>).current = event.target.value
            setGlobalError(false)
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start">{name}</InputAdornment>,
          }}
        >
          {(ty.info as EnumTypeInfo).variants.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </FormControl>
    )
  } else if (isStruct(ty.id)) {

    return (
        Object.entries((newValue as {[name : string] : MutableValue})).map(([newName, newValue]) => {
      if (value) {
        return <DisplayTextFields ty={(ty.info as StructTypeInfo).attributes[newName]} unit={unit} value={(value as {[name : string] : Value})[newName]} newValue={newValue} name={newName} localErrors={localErrors} setLocalErrors={setLocalErrors} setGlobalError={setGlobalError} />
      } else {
        return <DisplayTextFields ty={(ty.info as StructTypeInfo).attributes[newName]} unit={unit} value={value} newValue={newValue} name={newName} localErrors={localErrors} setLocalErrors={setLocalErrors} setGlobalError={setGlobalError} />
      }
    })
    )


  } else {
    localErrors.push(error)
    setLocalErrors(localErrors)
    return (
      <FormControl sx={{ width: name ? '45ch' : '25ch' }} variant="outlined">
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
            setGlobalError(false)
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

type MutableValue = MutableRefObject<number> | MutableRefObject<string> | {[name : string] : MutableValue};

function createInitial(ty: Type): MutableValue {
  if (isStruct(ty.id)) {
    let structInfo = ty.info as StructTypeInfo;
    let value: {[name : string] : MutableValue} = {}

    Object.entries(structInfo.attributes).forEach(function ([name, type]) {
      value[name] = createInitial(type)
    })
    return value

  } else if (isInt(ty.id) || isUInt(ty.id) || isReal(ty.id)) {
    return useRef<number>(NaN)
  } else {
    return useRef<string>("")
  }
}

function isInitial(ty: Type, newValue: MutableValue): boolean {
  if (isInt(ty.id) || isUInt(ty.id) || isReal(ty.id)) {
    return isNaN((newValue as MutableRefObject<number>).current)
  } else if (isEnum(ty.id)) {
    return (newValue as MutableRefObject<string>).current === ""
  } else {
    return !Object.entries((newValue as {[name : string] : MutableValue})).map(([name, value]) => isInitial((ty.info as StructTypeInfo).attributes[name], value)).includes(false)
  }
}

function EditDialog({ onClose, open, nodeName, objectEntryName, objectEntryInfo }: Readonly<EditDialogProps>) {
  let [value, setValue] = useState<ObjectEntryEvent | null>(null);
  let [globalError, setGlobalError] = useState<boolean>(false);
  let [localErrors, setLocalErrors] = useState<boolean[]>([])
  let newValue: MutableValue = createInitial(objectEntryInfo.ty)

  useEffect(()=>{
    console.log("init");
  }, []);

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
          newValue={newValue} localErrors={localErrors} setLocalErrors={setLocalErrors} setGlobalError={setGlobalError} />
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
