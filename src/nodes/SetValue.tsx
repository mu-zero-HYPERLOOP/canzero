import {MutableRefObject, SetStateAction, useEffect, useRef, useState} from "react";
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
import {
    isInt,
    isObjectEntryCompositeType,
    isReal,
    isStringArray,
    isUint,
    ObjectEntryInformation,
    ObjectEntryType
} from "./types/ObjectEntryInformation.ts";
import ObjectEntryEvent, {ObjectEntryComposite, ObjectEntryValue} from "./types/ObjectEntryEvent.ts";
import {invoke} from "@tauri-apps/api";
import ObjectEntryListenLatestResponse from "./types/ObjectEntryListenLatestResponse.ts";
import {listen} from "@tauri-apps/api/event";
import TextField from "@mui/material/TextField";

const INVALID_CHARACTERS: string = "Invalid characters"
const NEGATIVE: string = "Value must be positive"
const NON_INTEGER: string = "Value must be an integer"
const NOT_A_NUMBER: string = "Value is not a number"

function checkInput(val: string, type: ObjectEntryType, setError: (error: boolean) => void, setErrorMsg: (errorMsg: string | null) => void) {
    if (val === "" || isStringArray(type)) {
        setError(false)
        return;
    } else if (isInt(type)) {
        let regExp = /[a-z]/i;
        let num = parseInt(val)
        if (regExp.test(val)) setErrorMsg(INVALID_CHARACTERS)
        else if (isNaN(num)) setErrorMsg(NOT_A_NUMBER)
        else if (val.includes(".")) setErrorMsg(NON_INTEGER)
        else {
            setError(false)
            return;
        }
    } else if (isUint(type)) {
        let regExp = /[a-z]/i;
        let num = parseInt(val)
        if (regExp.test(val)) setErrorMsg(INVALID_CHARACTERS)
        else if (isNaN(num)) setErrorMsg(NOT_A_NUMBER)
        else if (val.includes(".")) setErrorMsg(NON_INTEGER)
        else if (num < 0) setErrorMsg(NEGATIVE)
        else {
            setError(false)
            return;
        }
    } else if (isReal(type)) {
        let regExp = /[a-z]/i;
        let num = parseFloat(val)
        if (regExp.test(val)) setErrorMsg(INVALID_CHARACTERS)
        else if (isNaN(num)) setErrorMsg(NOT_A_NUMBER)
        else {
            setError(false)
            return;
        }
    }
    setError(true)
}

function invokeBackend(node: string, objectEntry: string, val: ObjectEntryValue, setError: {
    (value: SetStateAction<boolean>): void;
    (arg0: boolean): void;
}) {
    setError(false)
    invoke("set_object_entry_value", {
        nodeName: node,
        objectEntryName: objectEntry,
        newValueJson: JSON.stringify(val),
    }).catch((_) => setError(true));
}

function convertMutableObjectEntryValue(value: MutableObjectEntryValue, ty: ObjectEntryType): ObjectEntryValue {
    if (isObjectEntryCompositeType(ty)) {
        value = value as MutableObjectEntryComposite
        return {name: value.name, value: value.value.map((value: { name : string, value : MutableObjectEntryValue}, index) => {
                return ({name: value.name, value: convertMutableObjectEntryValue(value.value, ty.attributes[index].type)})
            })}
    } else if (isInt(ty) || isUint(ty) || isReal(ty)) {
        return (value as MutableRefObject<number>).current
    } else {
        return (value as MutableRefObject<string>).current
    }
}

function updateMutableObjectEntryValue(newValue: MutableObjectEntryValue, value: ObjectEntryValue, ty: ObjectEntryType): ObjectEntryValue {
    if (isObjectEntryCompositeType(ty)) {
        newValue = newValue as MutableObjectEntryComposite
        return {name: newValue.name, value: newValue.value.map((current: { name : string, value : MutableObjectEntryValue}, index) => {
                return ({name: current.name, value: updateMutableObjectEntryValue(current.value, (value as ObjectEntryComposite).value[index].value, ty.attributes[index].type)})
            })}
    } else if (isInt(ty) || isUint(ty) || isReal(ty)) {
        return isNaN((newValue as MutableRefObject<number>).current) ? value : (newValue as MutableRefObject<number>).current
    } else {
        return (newValue as MutableRefObject<string>).current === "" ? value : (newValue as MutableRefObject<string>).current
    }
}

function sendInput(node: string, objectEntry: string, type: ObjectEntryType, value: ObjectEntryEvent | null, newValue: MutableObjectEntryValue, setError: {
    (value: SetStateAction<boolean>): void;
    (arg0: boolean): void;
}) {
    if (!value) {
        invokeBackend(node, objectEntry, convertMutableObjectEntryValue(newValue, type), setError)
    } else {
        invokeBackend(node, objectEntry, updateMutableObjectEntryValue(newValue, value.value, type), setError)
    }
}

interface DisplayTextFieldsProps {
    ty: ObjectEntryType,
    unit?: string,
    value: ObjectEntryValue | undefined,
    newValue: MutableObjectEntryValue,
    name?: string,
}

function DisplayTextFields({ty, unit, value, newValue, name}: Readonly<DisplayTextFieldsProps>) {
    let [errorMsg, setErrorMsg] = useState<string | null>(null)
    let [error, setError] = useState<boolean>(false)

    let endAdornment = unit ? <InputAdornment position="end">{unit}</InputAdornment> : undefined;
    let startAdornment = name ? <InputAdornment position="start">{name}</InputAdornment> : undefined;

    if (isStringArray(ty)) {
        return (
            <FormControl sx={{width: '25ch'}} variant="outlined">
                <FormHelperText id="outlined-weight-helper-text1">
                    {error ? errorMsg : 'Set Value:'}
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
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </TextField>
            </FormControl>
        )
    } else if (isObjectEntryCompositeType(ty)) {
        (newValue as MutableObjectEntryComposite).value.forEach(function (newVal, index) {
            if (value) {
                return <DisplayTextFields ty={ty.attributes[index].type} unit={unit} value={(value as ObjectEntryComposite).value[index].value} newValue={newVal.value} name={ty.name}/>
            } else {
                return <DisplayTextFields ty={ty.attributes[index].type} unit={unit} value={value} newValue={newVal.value} name={ty.name}/>
            }
        })


    } else {
        return (
            <FormControl sx={{width: '25ch'}} variant="outlined">
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
                        (event.target.value === "") ? (newValue as MutableRefObject<number>).current = NaN : (newValue as MutableRefObject<number>).current = Number(event.target.value)
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
    value: {name : string, value : MutableObjectEntryValue}[],
}

function createInitial(ty: ObjectEntryType ): MutableObjectEntryValue {
    if (isObjectEntryCompositeType(ty)) {
        return {name: ty.name, value: ty.attributes.map((value: { name : string, type : ObjectEntryType}) => {
            return ({name: value.name, value: createInitial(value.type)})
            })}
    } else if (isInt(ty) || isUint(ty) || isReal(ty)) {
        return useRef<number>(NaN)
    } else {
        return useRef<string>("")
    }
}

function isDisabled(ty: ObjectEntryType, newValue: MutableObjectEntryValue): boolean {

    // TODO: Check textfields

    if (isInt(ty) || isUint(ty) || isReal(ty)) {
        return isNaN((newValue as MutableRefObject<number>).current)
    } else if (isStringArray(ty)) {
        return (newValue as MutableRefObject<string>).current === ""
    } else {
        return !(newValue as MutableObjectEntryComposite).value.map((value, index) => isDisabled(ty.attributes[index].type, value.value)).includes(false)
    }
}

function EditDialog({onClose, open, nodeName, objectEntryName, objectEntryInfo}: Readonly<EditDialogProps>) {
    let [value, setValue] = useState<ObjectEntryEvent | null>(null);
    let [error, setError] = useState<boolean>(false);
    let newValue: MutableObjectEntryValue = createInitial(objectEntryInfo.ty)

    async function registerListener() {
        let {event_name, latest} = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value",
            {nodeName, objectEntryName});
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
        <Paper sx={{...dialogStyle}}>
            <Stack direction="column" spacing={2} ml={2} mr={2}>
                <Stack direction="row" sx={{
                    position: "relative",
                    left: "-20px",
                }}>
                    <Typography fontWeight={20} sx={{marginRight: "8px"}}>
                        <strong>Edit:</strong>
                    </Typography>
                    <Typography>
                        {`${objectEntryInfo.name} of ${nodeName}`}
                    </Typography>
                </Stack>
                <DisplayTextFields ty={objectEntryInfo.ty} unit={objectEntryInfo.unit} value={value?.value}
                                   newValue={newValue}/>
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
                        // TODO: proper error message
                        color={error ? "error" : "primary"}
                        disabled={isDisabled(objectEntryInfo.ty, newValue)}
                        onClick={() => {
                            sendInput(nodeName, objectEntryName, objectEntryInfo.ty, value, newValue, setError)
                            console.log(newValue)
                        }}
                    >
                        Upload
                    </Button>
                </Box>
            </Stack>
        </Paper>
    </Modal>
}

interface SetValueButtonProps {
    nodeName: string,
    objectEntryName: string,
    objectEntryInfo: ObjectEntryInformation
}

function SetValueButton({nodeName, objectEntryName, objectEntryInfo}: Readonly<SetValueButtonProps>) {
    let [showDialog, setShowDialog] = useState(false);

    return <>
        <Button
            variant="outlined"
            startIcon={
                <CreateIcon/>
            }
            color="primary"
            size="small"
            sx={{
                position: "absolute",
                top: "10px",
                right: "60px",
                width: "100px",
            }}
            onClick={() => setShowDialog(true)}
        >
            Edit
        </Button>
        <EditDialog
            open={showDialog}
            onClose={() => setShowDialog(false)}
            nodeName={nodeName}
            objectEntryName={objectEntryName}
            objectEntryInfo={objectEntryInfo}
        />
    </>
}

export default SetValueButton
