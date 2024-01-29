import {useEffect, useState} from "react";
import {ObjectEntryInformation} from "./types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";
import {NodeInformation} from "./types/NodeInformation.ts";
import {
    Paper,
    Skeleton,
    Typography
} from "@mui/material";
import SetValueButton from "./SetValue.tsx";
import RefreshButton from "./RefreshButton.tsx";
import GraphList from "./GraphList.tsx";

interface ObjectEntryPanelProps {
    node: NodeInformation,
    name: string,
    useGraphScrolling?: boolean,
}

function ObjectEntryPanel({node, name, useGraphScrolling = true}: Readonly<ObjectEntryPanelProps>) {
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
                <RefreshButton nodeName={node.name} objectEntryName={information.name}/>
                <SetValueButton nodeName={node.name} objectEntryName={information.name} objectEntryInfo={information}/>
                <GraphList
                  information={information}
                  nodeName={node.name}
                  useScrolling={useGraphScrolling}
                />
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

        }} variant="h5">{node.name}::{name}
        </Typography>
        <Content/>

    </Paper>
}

export default ObjectEntryPanel;

