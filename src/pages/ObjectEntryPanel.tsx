import {NodeInformation} from "../types/NodeInformation";
import {useEffect, useState} from "react";
import {ObjectEntryInformation} from "../types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";

interface ObjectEntryPanelProps {
    node: NodeInformation,
    name: string,
}

function ObjectEntryPanel({node, name}: ObjectEntryPanelProps) {
    const [objectEntry, setObjectEntry] = useState<ObjectEntryInformation>({name: "", id: -1});

    async function asyncFetchNetworkInfo() {

        let objectEntryInformation = await invoke<ObjectEntryInformation>("object_entry_information", {
            nodeName: node.name,
            objectEntryName: name
        });
        setObjectEntry(objectEntryInformation);
    }

    useEffect(() => {
        asyncFetchNetworkInfo().catch(console.error);
    });


    return <>
        <h1> Hello {objectEntry.name} of {node.name} </h1>
        <label>
            Value: <input name="SetObjectDictionaryValue"/>
        </label>
    </>
}

export default ObjectEntryPanel;

