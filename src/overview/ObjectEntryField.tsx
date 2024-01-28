import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import {useEffect, useState} from "react";
import {
    isInt,
    isObjectEntryCompositeType,
    isReal,
    isStringArray,
    isUint,
    ObjectEntryInformation,
    ObjectEntryType
} from "../nodes/types/ObjectEntryInformation.ts";
import ObjectEntryEvent, {ObjectEntryComposite, ObjectEntryValue} from "../nodes/types/ObjectEntryEvent.ts";
import {invoke} from "@tauri-apps/api";
import ObjectEntryListenLatestResponse from "../nodes/types/ObjectEntryListenLatestResponse.ts";
import {listen} from "@tauri-apps/api/event";
import {Skeleton} from "@mui/material";
import TextField from "@mui/material/TextField";
import interpolate from "color-interpolate";

function getColor(value: number, min: number, max: number) {
    let colormap = interpolate(['#2E9B33', '#FFD500', '#E32E13']);
    let percent = (value - min) / (max - min)
    return colormap(percent)
}

function displayEntry(ty: ObjectEntryType, value: ObjectEntryValue, name: string, min: number | undefined, max: number | undefined) {
    if (isStringArray(ty)) {
        return <TextField InputProps={{readOnly: true}} value={value} label={name} sx={{
            '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                    borderColor: "#B7BFC7",
                },
            },
        }}/>
    } else if (isInt(ty) || isUint(ty) || isReal(ty)) {
        if (min && max) return <TextField InputProps={{readOnly: true}} value={Number(value).toFixed(1)} label={name} sx={{
            '& .MuiOutlinedInput-root': {
                '& fieldset': {
                    borderWidth: "2px",
                    borderColor: getColor(Number(value), min, max),
                },
                '&:hover fieldset': {
                    borderWidth: "2px",
                    borderColor: getColor(Number(value), min, max),
                },
                '&.Mui-focused fieldset': {
                    borderWidth: "3px",
                    borderColor: getColor(Number(value), min, max),
                },
            },
        }}/>
        else return <TextField InputProps={{readOnly: true}} value={Number(value).toFixed(1)} label={name} sx={{
            '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                    borderColor: "#B7BFC7",
                },
            },
        }}/>
    } else if (isObjectEntryCompositeType(ty)) {
        // TODO: Check if an and how this works
        let oec: ObjectEntryComposite = value as ObjectEntryComposite
        oec.value.forEach(function (value, index) {
            displayEntry(ty.attributes[index].type, value.value, value.name, min, max)
        })
    }
}

interface ObjectEntryFieldProps {
    node: NodeInformation,
    name: string
    min?: number
    max?: number
}
function ObjectEntryField({node, name, min, max}: Readonly<ObjectEntryFieldProps>) {
    let [information, setInformation] = useState<ObjectEntryInformation | null>(null);
    let [value, setValue] = useState<ObjectEntryEvent | null>(null);

    function updateValue(event: ObjectEntryEvent) {
        setValue(event);
    }

    async function fetchInformation() {
        let information = await invoke<ObjectEntryInformation>("object_entry_information",
            {nodeName: node.name, objectEntryName: name});
        setInformation(information);
        return information;
    }

    async function registerListener() {
        let {event_name, latest} = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value",
            {nodeName: node.name, objectEntryName: name});
        updateValue(latest);
        let unlistenBackend = () => invoke("unlisten_from_latest_object_entry_value", {
            nodeName: node.name, objectEntryName: name
        }).catch(console.error);

        let unlistenReact = await listen<ObjectEntryEvent>(event_name, event => updateValue(event.payload));

        return () => {
            unlistenBackend();
            unlistenReact();
        }
    }

    async function asyncTask() {
        await fetchInformation();
        // wait for fetch Information to be complete before listeningS
        // allows using the information in updateValue!
        return await registerListener();
    }

    useEffect(() => {

        let cleanup = asyncTask();
        return () => {
            cleanup.then(f => f()).catch(console.error);
            setInformation(null);
            setValue(null);
        }
    }, [node, name]);


    if (information && value) {
        return displayEntry(information.ty, value.value, information.name, min, max)
    } else {
        return <Skeleton variant="rounded" height={"100px"}/>
    }
}

export default ObjectEntryField