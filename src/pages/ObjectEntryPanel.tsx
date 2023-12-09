import {NodeInformation} from "../types/NodeInformation";
import {useEffect, useState} from "react";
import {ObjectEntryInformation} from "../types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";
import Graph from "../components/Graph.tsx";
import ObjectEntryListenLatestResponse from "../types/ObjectEntryListenLatestResponse.ts";
import ObjectEntryEvent from "../types/ObjectEntryEvent.ts";
import { Event, listen } from "@tauri-apps/api/event";

interface ObjectEntryPanelProps {
    node: NodeInformation,
    name: string,   // name of obejct entry
}

function ObjectEntryPanel({ node, name }: ObjectEntryPanelProps) {
  const [objectEntryInfo, setObjectEntryInfo] = useState<ObjectEntryInformation>({ name: "name", id: -1, ty: "int" });
  const [objectEntryEvent, setObjectEntryEvent] = useState<ObjectEntryEvent>({ value: 0, timestamp: 0, delta_time: 0 })

  async function asyncFetchNetworkInfo() {

    let objectEntryInformation = await invoke<ObjectEntryInformation>("object_entry_information", {
      nodeName: node.name,
      objectEntryName: name
    });
    setObjectEntryInfo(objectEntryInformation);
  }

  async function asyncListenToEvents() {
    let objectEntryListenLatestResponse = await invoke<ObjectEntryListenLatestResponse>("listen_to_latest_object_entry_value", {
      nodeName: node.name,
      objectEntryName: name
    });

    if (objectEntryListenLatestResponse.latest != null) {
      setObjectEntryEvent(objectEntryListenLatestResponse.latest)
    }

    return await listen<ObjectEntryEvent>(objectEntryListenLatestResponse.event_name, (event : Event<ObjectEntryEvent>) => {
      setObjectEntryEvent(event.payload)
    })
  }

  useEffect(() => {
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

  return <>
    <h1> Hello {objectEntryInfo.name} of {node.name} </h1>
    <Graph nodeName={node.name} oeName={name} />
    <label>
      Value: <input name="SetObjectDictionaryValue" value={objectEntryEvent.value.toString()} />
    </label>
  </>
}

export default ObjectEntryPanel;

