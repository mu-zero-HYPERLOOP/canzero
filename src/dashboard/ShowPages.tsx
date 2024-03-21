import {Route, Routes, useLocation} from "react-router-dom";
import OverviewPanel from "../overview/OverviewPanel.tsx";
import {Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import {NetworkInformation} from "../nodes/types/NetworkInformation.ts";
import NodePanel from "../nodes/NodePanel.tsx";
import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import LevitationControl from "../divisions/LevitationControl.tsx";
import GuidanceControl from "../divisions/GuidanceControl.tsx";
import MotorControl from "../divisions/MotorControl.tsx";
import ObjectEntryPanel from "../object_entry/panel/ObjectEntryPanel.tsx";
import Trace from '../trace/Trace.tsx';

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

function ShowPages({connectionSuccess}: Readonly<ConnectionProps>) {
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
            <Route key={"Overview"} index element={<OverviewPanel connectionSuccess={connectionSuccess} nodes={nodes}/>}/>
            <Route key={"TracePanel"} path="TracePanel" element={<Trace/>}/>
            <Route key={"LevitationControl"} path="LevitationControl" element={<LevitationControl nodes={nodes}/>}/>
            <Route key={"GuidanceControl"} path="GuidanceControl" element={<GuidanceControl nodes={nodes}/>}/>
            <Route key={"MotorControl"} path="MotorControl" element={<MotorControl nodes={nodes}/>}/>
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
            <Route key={"*"} path="*" element={<Content/>}/>
        </Routes>
    );
}

export default ShowPages;
