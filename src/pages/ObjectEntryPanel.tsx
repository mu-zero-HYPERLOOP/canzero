import {SetStateAction, useEffect, useMemo, useState} from "react";
import {
    isInt,
    isReal,
    isStringArray,
    isUint,
    ObjectEntryCompositeType,
    ObjectEntryInformation,
    ObjectEntryType
} from "../types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";
import {NodeInformation} from "../types/NodeInformation";
import ObjectEntryListenLatestResponse from "../types/ObjectEntryListenLatestResponse.ts";
import ObjectEntryEvent, {ObjectEntryComposite, ObjectEntryValue} from "../types/ObjectEntryEvent.ts";
import {listen} from "@tauri-apps/api/event";
import ObjectEntryGraph from "../components/Graph.tsx";
import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
    Modal,
    OutlinedInput,
    Paper,
    Skeleton,
    Stack,
    Typography
} from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import CreateIcon from '@mui/icons-material/Create';

// interface DisplayObjectEntryEvent {
//     objectEntryInfo: ObjectEntryInformation
//     objectEntryEvent: ObjectEntryEvent
//     nodeName: string
// }

function checkInput(node: string, objectEntry: string, val: string, type: ObjectEntryType, setError: {
    (value: SetStateAction<boolean>): void;
    (arg0: boolean): void;
}) {
    setError(false)

    if (isInt(type)) {
        if (!val.includes(".")) {
            let num = parseInt(val)
            if (!isNaN(num)) {
                invoke("new_object_entry_value", {
                    nodeName: node,
                    objectEntryName: objectEntry,
                    value: num
                })
                return;
            }
        }
    } else if (isUint(type)) {
        if (!val.includes(".")) {
            let num = parseInt(val)
            if (!isNaN(num) && num >= 0) {
                invoke("new_object_entry_value", {
                    nodeName: node,
                    objectEntryName: objectEntry,
                    value: num
                })
                return;
            }
        }
    } else if (isReal(type)) {
        let num = parseFloat(val)
        if (!isNaN(num)) {
            invoke("new_object_entry_value", {
                nodeName: node,
                objectEntryName: objectEntry,
                value: num
            })
            return;
        }
    } else if (isStringArray(type)) {
        if (type.includes(val)) {
            invoke("new_object_entry_value", {
                nodeName: node,
                objectEntryName: objectEntry,
                value: val
            })
            return;
        }
    }
    setError(true)
}
//
// function ObjectEntryValue({objectEntryInfo, objectEntryEvent, nodeName}: Readonly<DisplayObjectEntryEvent>) {
//     const newValue = useRef<string>("");
//     const [error, setError] = useState<boolean>(false)
//
//     if (isObjectEntryCompositeType(objectEntryInfo.ty)) {
//         return <></>
//     } else {
//         return <Box
//             component="form"
//             sx={{
//                 '& > :not(style)': {m: 1, width: '25ch'},
//             }}
//             noValidate
//             autoComplete="off"
//         >
//             <TextField
//                 key={"currentValue" + nodeName + "/" + objectEntryInfo.name}
//                 id={"currentValue"}
//                 label="Current value"
//                 variant="outlined"
//                 value={showValueTextField(objectEntryEvent.value, objectEntryInfo.ty) + " " + (typeof objectEntryInfo.unit === "string" ? objectEntryInfo.unit : null)}
//                 InputProps={{
//                     readOnly: true,
//                 }}/>
//             <TextField
//                 key={"setValue" + nodeName + "/" + objectEntryInfo.name}
//                 id={"setValue"}
//                 label="Set value"
//                 variant="outlined"
//                 error={error}
//                 onAnimationStart={() => setError(false)}
//                 onChange={(event) => {
//                     newValue.current = event.target.value
//                 }}
//                 onKeyDown={(event) => {
//                     if (event.key == "Enter") {
//                         event.preventDefault();
//                         checkInput(nodeName, objectEntryInfo.name, newValue.current, objectEntryInfo.ty, setError)
//                     }
//                 }}
//             />
//         </Box>
//     }
// }

interface RefreshButtonProps {
    nodeName: string,
    objectEntryName: string,
}

function RefreshButton({nodeName, objectEntryName}: RefreshButtonProps) {
    const [getReqInProgess, setGetReqInProgess] = useState(false);

    function handleRefreshClick() {
        setGetReqInProgess(true);
        invoke("request_object_entry_value",
            {nodeName, objectEntryName}).then(() => {
            setGetReqInProgess(false);
        }).catch(() => {
            setGetReqInProgess(false);
        });
    }

    return <IconButton
        size="small"
        onClick={handleRefreshClick}
        sx={{
            position: "absolute",
            top: "7px",
            left: "calc(100% - 50px)",
        }}>
        {getReqInProgess ?
            <CircularProgress size={15} sx={{color: "grey"}}/> :
            <RefreshIcon fontSize="small"/>}
    </IconButton>
}


const dialogStyle = {
    position: 'absolute' as 'absolute',
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
    objectEntryName: string,
}

function EditDialog({onClose, open, nodeName, objectEntryName}: EditDialogProps) {

    let [information, setInformation] = useState<ObjectEntryInformation | null>(null);
    let [value, setValue] = useState<ObjectEntryEvent | null>(null);
    let [error, setError] = useState<boolean>(false);

    function updateValue(event: ObjectEntryEvent, information: ObjectEntryInformation) {
        console.log("update value!");
        setValue(event);
    }

    async function fetchInformation() {
        let information = await invoke<ObjectEntryInformation>("object_entry_information",
            {nodeName, objectEntryName});
        setInformation(information);
        return information;
    }

    async function registerListener(information: ObjectEntryInformation) {
        let {event_name, latest} = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value",
            {nodeName, objectEntryName});
        updateValue(latest, information);
        let unlistenBackend = () => invoke("unlisten_from_latest_object_entry_value", {
            nodeName,
            objectEntryName
        }).catch(console.error);

        let unlistenReact = await listen<ObjectEntryEvent>(event_name, event => updateValue(event.payload, information));

        return () => {
            unlistenBackend();
            unlistenReact();
        }
    }

    async function asyncTask() {
        let information = await fetchInformation();
        console.log("fetched information", information);
        // wait for fetch Information to be complete before listeningS
        // allows using the information in updateValue!
        return await registerListener(information);
    }

    useEffect(() => {
        if (open) {
            console.log("use effect");
            let cleanup = asyncTask();
            return () => {
                cleanup.then(f => f()).catch(console.error);
                setInformation(null);
                setValue(null);
            }
        }
    }, [nodeName, objectEntryName, open]);

    let adornment = information?.unit ? <InputAdornment position="end">{information.unit}</InputAdornment> : undefined;

    return <Modal
        open={open && information != null}
        onClose={onClose}>
        <Paper sx={{...dialogStyle}}>
            <Stack direction="column" spacing={2}>
                <Stack direction="row" sx={{
                    position: "relative",
                    left: "-10px",
                }}>
                    <Typography fontWeight={20} sx={{marginRight: "8px"}}>
                        <strong>Edit:</strong>
                    </Typography>
                    <Typography>
                        {`${information?.name} of ${nodeName}`}
                    </Typography>
                </Stack>
                <FormControl sx={{width: '25ch'}} variant="outlined">
                    <FormHelperText id="outlined-weight-helper-text1">
                        Weight
                    </FormHelperText>
                    <OutlinedInput
                        placeholder={value ? `${value.value}` : undefined}
                        id="outlined-adornment-weight1"
                        endAdornment={adornment}
                        aria-describedby="outlined-weight-helper-text1"
                        inputProps={{
                            'aria-label': 'weight',
                        }}
                        error={error}
                    />
                </FormControl>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end"
                    }}
                >

                    <Button
                        variant="outlined"
                        sx={{
                            marginLeft: "auto"
                        }}
                        disabled={error}
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
}

function SetValueButton({nodeName, objectEntryName}: SetValueButtonProps) {
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
        />
    </>
}

interface GraphListProps {
    information: ObjectEntryInformation,
    nodeName: string,
}

// This function is not tested property because the backend currently doesn't any
// structures messages!
function GraphList({information, nodeName}: GraphListProps) {
    function computeRenderFunc(
        property: (event: ObjectEntryEvent) => ObjectEntryValue,
        ty: ObjectEntryType,
        propertyName?: string,
    ): () => JSX.Element {
        if ((ty as any).name != undefined) {
            let compositeType = information.ty as ObjectEntryCompositeType;

            let renderFuncs = compositeType.attributes.map((attrib, index) => {
                return computeRenderFunc(
                    (event) => (property(event) as ObjectEntryComposite).value[index],
                    attrib.type,
                    propertyName ? `${propertyName}.${attrib.name}` : attrib.name
                );
            });

            return () => <> {renderFuncs.map(f => f())}</>;
        } else if (Array.isArray(ty)) {
            // Enum Type
            let entries = ty as string[];
            return () => {
                return <ObjectEntryGraph
                    nodeName={nodeName}
                    objectEntryInformation={information}
                    property={(event) => event.value as number}
                    propertyName={propertyName}
                />
            };
        } else {
            // Primitive type
            return () => {
                return <ObjectEntryGraph
                    nodeName={nodeName}
                    objectEntryInformation={information}
                    property={(event) => event.value as number}
                    propertyName={propertyName}
                />
            };
        }
    }

    let renderFunc = useMemo(() => computeRenderFunc((event) => event.value, information.ty), [nodeName, information.name]);

    return renderFunc();
}

interface ObjectEntryPanelProps {
    node: NodeInformation,
    name: string,
}

function ObjectEntryPanel({node, name}: ObjectEntryPanelProps) {


    const [information, setInformation] = useState<ObjectEntryInformation | null>(null);

    useEffect(() => {
        async function fetchInformation() {
            let information = await invoke<ObjectEntryInformation>("object_entry_information",
                {nodeName: node.name, objectEntryName: name});
            setInformation(information);
        }

        fetchInformation().catch(console.error);
        return () => {
            setInformation(null);
        };
    }, [node.name, name]);


    function Content() {
        if (information) {
            return <>
                {information.description ? <Typography sx={{
                        position: "absolute",
                        top: "18px",
                        left: "20px",
                        padding: "1px",

                    }} variant="subtitle2">{information.description}</Typography>
                    : <></>}
                <RefreshButton nodeName={node.name} objectEntryName={information?.name}/>
                <SetValueButton nodeName={node.name} objectEntryName={information?.name}/>
                <GraphList information={information} nodeName={node.name}/>
            </>
        } else {
            return <Skeleton variant="rounded" height={"300px"}/>
        }

    }

    return <Paper sx={{
        marginTop: "30px",
        marginLeft: "8px",
        marginRight: "10px",
        paddingLeft: "12px",
        paddingRight: "12px",
        paddingTop: "45px",
        paddingBottom: "20px",
        width: "calc(100% - 16px)",
        position: "relative"
    }}>
        <Typography sx={{
            position: "absolute",
            top: "-12px",
            left: "12px",
            padding: "1px",

        }} variant="h5">{node.name}::{name}</Typography>
        <Content/>

    </Paper>

}

export default ObjectEntryPanel;

