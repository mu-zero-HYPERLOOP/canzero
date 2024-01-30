import {SetStateAction, useEffect, useRef, useState} from "react";
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    InputAdornment,
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
import ObjectEntryEvent from "./types/ObjectEntryEvent.ts";
import {invoke} from "@tauri-apps/api";
import ObjectEntryListenLatestResponse from "./types/ObjectEntryListenLatestResponse.ts";
import {listen} from "@tauri-apps/api/event";

const INVALID_CHARACTERS: string = "Invalid characters"
const NEGATIVE: string = "Value must be positive"
const NON_INTEGER: string = "Value must be an integer"
const NOT_A_NUMBER: string = "Value is not a number"

function invokeBackend(node: string, objectEntry: string, val: string) {
    return invoke("set_object_entry_value", {
        nodeName: node,
        objectEntryName: objectEntry,
        newValueJson: val,
    })
}

function checkInput(val: string, type: ObjectEntryType, setError: {
                        (value: SetStateAction<boolean>): void;
                        (arg0: boolean): void;
                    },
                    setErrorMsg: {
                        (value: SetStateAction<string | null>): void;
                        (arg0: string | null): void;
                    }) {
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

function sendInput(node: string, objectEntry: string, val: string, type: ObjectEntryType, setError: {
    (value: SetStateAction<boolean>): void;
    (arg0: boolean): void;
}) {
    if (isInt(type) || isUint(type) || isReal(type)) {
        let num = parseInt(val)
        invokeBackend(node, objectEntry, num.toString()).catch((_) => setError(true));
    } else if (isStringArray(type)) {
        invokeBackend(node, objectEntry, val).catch((_) => setError(true));
    } else if (isObjectEntryCompositeType(type)) {
        invokeBackend(node, objectEntry, val).catch((_) => setError(true));
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

function EditDialog({onClose, open, nodeName, objectEntryName, objectEntryInfo}: Readonly<EditDialogProps>) {
    let [value, setValue] = useState<ObjectEntryEvent | null>(null);
    let [error, setError] = useState<boolean>(false);
    const newValue = useRef<string>("");
    let [errorMsg, setErrorMsg] = useState<string | null>(null)

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

    let adornment = objectEntryInfo?.unit ?
        <InputAdornment position="end">{objectEntryInfo.unit}</InputAdornment> : undefined;

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
                <FormControl sx={{width: '25ch'}} variant="outlined">
                    <FormHelperText id="outlined-weight-helper-text1">
                        {error ? errorMsg : 'Set Value:'}
                    </FormHelperText>
                    <OutlinedInput
                        placeholder={value ? `${value.value}` : undefined}
                        id="outlined-adornment-weight1"
                        endAdornment={adornment}
                        aria-describedby="outlined-weight-helper-text1"
                        inputProps={{
                            'aria-label': 'weight',
                        }}
                        onAnimationStart={() => setError(false)}
                        onChange={(event) => {
                            newValue.current = event.target.value
                            checkInput(newValue.current, objectEntryInfo.ty, setError, setErrorMsg)
                        }}
                        error={error}
                    />
                </FormControl>
                <Box component="form"
                     sx={{
                         display: "flex",
                         justifyContent: "flex-end",
                     }}
                >
                    <Button
                        variant="outlined"
                        disabled={error}
                        sx={{
                            marginLeft: "auto",
                        }}
                        onClick={() => {
                            sendInput(nodeName, objectEntryName, newValue.current, objectEntryInfo.ty, setError)
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
