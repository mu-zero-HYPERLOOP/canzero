import {Route, Routes, useLocation} from "react-router-dom";
import OverviewPanel from "./OverviewPanel.tsx";
import TracePanel from "./TracePanel.tsx";
import {Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import {NetworkInformation} from "../types/NetworkInformation";
import NodePanel from "./NodePanel";
import {NodeInformation} from "../types/NodeInformation";
import ObjectEntryPanel from "./ObjectEntryPanel";
import LevitationControl from "./LevitationControl.tsx";
import GuidanceControl from "./GuidanceControl.tsx";
import MotorControl from "./MotorControl.tsx";

function Content() {
    const location = useLocation();
    return (
        <Typography variant="body2" sx={{pb: 2}} color="text.secondary">
            Current route: {location.pathname}
        </Typography>
    );
}

interface ConnectionProps {
    connectionSuccess: boolean
}

function ShowPages({connectionSuccess}: ConnectionProps) {
    const [nodes, setNodes] = useState<NodeInformation[]>([]);

    async function asyncFetchNodeData() {
        let nodes = [];
        let networkInformation = await invoke<NetworkInformation>("network_information");
        for (let nodeName of networkInformation.node_names) {
            let nodeInformation = await invoke<NodeInformation>("node_information", {nodeName: nodeName});
            nodes.push(nodeInformation);
        }
        setNodes(nodes);
    }


    useEffect(() => {
        // this asynchronously (in the background) invokes function
        asyncFetchNodeData().catch(console.error);
    }, []);

    return (
        <Routes>
            <Route index element={<OverviewPanel connectionSuccess={connectionSuccess}/>}/>
            <Route path="TracePanel" element={<TracePanel/>}/>
            <Route path="LevitationControl" element={<LevitationControl nodes={nodes}/>}/>
            <Route path="GuidanceControl" element={<GuidanceControl nodes={nodes}/>}/>
            <Route path="MotorControl" element={<MotorControl nodes={nodes}/>}/>
            {nodes.map((node) => {

                let routes = [<Route key={node.name} path={node.name} element={<NodePanel node={node}/>}/>];
                for (let objectEntryName of node.object_entries) {
                    routes.push(
                        <Route
                            key={`${node.name}/${objectEntryName}`}
                            path={`${node.name}/${objectEntryName}`}
                            element={<ObjectEntryPanel node={node} name={objectEntryName}/>}
                        />);
                }

                return <>{routes}</>
            })}
            <Route path="*" element={<Content/>}/>
        </Routes>
    );
}

export default ShowPages;
