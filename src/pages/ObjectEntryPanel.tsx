import {NodeInformation} from "../types/NodeInformation";
import {SetStateAction, useEffect, useRef, useState} from "react";
import {
    isInt,
    isObjectEntryCompositeType,
    isReal,
    isStringArray,
    isUint,
    ObjectEntryInformation,
    ObjectEntryType
} from "../types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";
import ObjectEntryListenLatestResponse from "../types/ObjectEntryListenLatestResponse.ts";
import ObjectEntryEvent, {ObjectEntryComposite} from "../types/ObjectEntryEvent.ts";
import {Event, listen} from "@tauri-apps/api/event";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import ObjectEntryGraph from "../components/Graph.tsx";

interface ObjectEntryPanelProps {
    node: NodeInformation,
    name: string,   // name of obejct entry
}

interface DisplayObjectEntryEvent {
    currentValue: number | string | ObjectEntryComposite
    type: ObjectEntryType
    node: string
    objectEntry: string
}

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

function returnDefaultValue(type: ObjectEntryType) {
    if (isStringArray(type)) {
        return {value: "", timestamp: 0, delta_time: 0}
    } else if (isObjectEntryCompositeType(type)) {
        return {value: 1, timestamp: 0, delta_time: 0} //TODO default value
    } else {
        return {value: 0, timestamp: 0, delta_time: 0}
    }
}

function showValueTextField(currentValue: number | string | ObjectEntryComposite, type: ObjectEntryType) {
    if (isStringArray(type)) {
        return currentValue;
    } else {
        return currentValue.toString();
    }
}

function ObjectEntryValue({currentValue, type, node, objectEntry}: Readonly<DisplayObjectEntryEvent>) {
    const newValue = useRef<string>("");
    const [error, setError] = useState<boolean>(false)

    if (isObjectEntryCompositeType(type)) {
        return <></>
    } else {
        return <Box
            component="form"
            sx={{
                '& > :not(style)': {m: 1, width: '25ch'},
            }}
            noValidate
            autoComplete="off"
        >
            <TextField
                key={"currentValue" + node + "/" + objectEntry}
                id={"currentValue"}
                label="Current value"
                variant="outlined"
                value={showValueTextField(currentValue, type)}
                InputProps={{
                    readOnly: true,
                }}/>
            <TextField
                key={"setValue" + node + "/" + objectEntry}
                id={"setValue"}
                label="Set value"
                variant="outlined"
                error={error}
                onAnimationStart={() => setError(false)}
                onChange={(event) => {
                    newValue.current = event.target.value
                }}
                onKeyDown={(event) => {
                    if (event.key == "Enter") {
                        event.preventDefault();
                        checkInput(node, objectEntry, newValue.current, type, setError)
                    }
                }}
            />
        </Box>
    }
}

function ObjectEntryPanel({node, name}: Readonly<ObjectEntryPanelProps>) {
    const [objectEntryInfo, setObjectEntryInfo] = useState<ObjectEntryInformation>({name: "name", id: -1, ty: "int"});
    const [objectEntryEvent, setObjectEntryEvent] = useState<ObjectEntryEvent>({value: 0, timestamp: 0, delta_time: 0})

    async function asyncFetchNetworkInfo() {

        let objectEntryInformation = await invoke<ObjectEntryInformation>("object_entry_information", {
            nodeName: node.name,
            objectEntryName: name
        });
        setObjectEntryInfo(objectEntryInformation);
    }

    useEffect(() => {
        async function asyncListenToEvents() {
            let objectEntryListenLatestResponse = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", {
                nodeName: node.name,
                objectEntryName: name
            });
            if (objectEntryListenLatestResponse.latest != null) {
                setObjectEntryEvent(objectEntryListenLatestResponse.latest)
            } else {
                setObjectEntryEvent(returnDefaultValue(objectEntryInfo.ty))
            }

            return await listen<ObjectEntryEvent>(objectEntryListenLatestResponse.event_name, (event: Event<ObjectEntryEvent>) => {
                setObjectEntryEvent(event.payload)
            })
        }

        asyncFetchNetworkInfo().catch(console.error);
        let unlisten = asyncListenToEvents();

        return () => {
            invoke("unlisten_from_latest_object_entry_value", {
                nodeName: node.name,
                objectEntryName: name
            })
            unlisten.then(f => f()).catch(console.error);
        }
    }, [node, name]);

    return <ObjectEntryGraph nodeName={node.name} oeName={name}/>
}

export default ObjectEntryPanel;

