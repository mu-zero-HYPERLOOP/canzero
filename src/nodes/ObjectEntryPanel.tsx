import {useEffect, useMemo, useState} from "react";
import {
    ObjectEntryCompositeType,
    ObjectEntryInformation,
    ObjectEntryType
} from "./types/ObjectEntryInformation.ts";
import {invoke} from "@tauri-apps/api";
import {NodeInformation} from "./types/NodeInformation.ts";
import ObjectEntryEvent, {ObjectEntryComposite, ObjectEntryValue} from "./types/ObjectEntryEvent.ts";
import ObjectEntryGraph from "./Graph.tsx";
import {
    Paper,
    Skeleton,
    Typography
} from "@mui/material";
import SetValueButton from "./SetValue.tsx";
import RefreshButton from "./RefreshButton.tsx";

interface GraphListProps {
    information: ObjectEntryInformation,
    nodeName: string,
    useScrolling?: boolean,
}

// This function is not tested property because the backend currently doesn't any
// structures messages!
function GraphList({information, nodeName, useScrolling = true}: GraphListProps) {
    function computeRenderFunc(
        property: (event: ObjectEntryEvent) => ObjectEntryValue,
        ty: ObjectEntryType,
        propertyName?: string,
    ): () => JSX.Element {
        if ((ty as any).name != undefined) {
            let compositeType = information.ty as ObjectEntryCompositeType;

            let renderFuncs = compositeType.attributes.map((attrib, index) => {
                return computeRenderFunc(
                    (event) => (property(event) as ObjectEntryComposite).value[index].value,
                    attrib.type,
                    propertyName ? `${propertyName}.${attrib.name}` : attrib.name
                );
            });

            return () => <> {renderFuncs.map(f => f())}</>;
        } else if (Array.isArray(ty)) {
            // Enum Type
            return () => {
                return <ObjectEntryGraph
                    nodeName={nodeName}
                    objectEntryInformation={information}
                    property={(event) => event.value as number}
                    propertyName={propertyName}
                    useScrolling={useScrolling}
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
                    useScrolling={useScrolling}
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
                <SetValueButton nodeName={node.name} objectEntryName={information.name}/>
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

        }} variant="h5">{node.name}::{name}</Typography>
        <Content/>

    </Paper>

}

export default ObjectEntryPanel;

