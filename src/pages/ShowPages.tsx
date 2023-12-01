import { Route, Routes, useLocation } from "react-router-dom";
import ControlPanel from "./ControlPanel";
import DebugPanel from "./DebugPanel";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { NetworkInformation } from "../types/NetworkInformation";
import NodePanel from "./NodePanel";
import { NodeInformation } from "../types/NodeInformation";
import ObjectEntryPanel from "./ObjectEntryPanel";
import CommandPanel from "./CommandPanel";

function Content() {
  const location = useLocation();
  return (
    <Typography variant="body2" sx={{ pb: 2 }} color="text.secondary">
      Current route: {location.pathname}
    </Typography>
  );
}

function ShowPages() {
  const [nodes, setNodes] = useState<NodeInformation[]>([]);

  async function asyncFetchNodeData() {
    let nodes = [];
    let networkInformation = await invoke<NetworkInformation>("network_information");
    for (let nodeName of networkInformation.node_names) {
      let nodeInformation = await invoke<NodeInformation>("node_information", { nodeName: nodeName });
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
      <Route index element={<ControlPanel />} />
      <Route path="DebugPanel" element={<DebugPanel />} />
      {nodes.map((node) => {

        let routes = [<Route path={node.name} element={<NodePanel node={node} />} />];
        for (let objectEntryName of node.object_entries) {
          routes.push(
            <Route 
              path={`${node.name}/${objectEntryName}`} 
              element={<ObjectEntryPanel node={node} name={objectEntryName} />} 
            />);
        }
        for (let commandName of node.commands) {
          routes.push(
            <Route 
              path={`${node.name}/${commandName}`} 
              element={<CommandPanel node={node} name={commandName} />} 
            />);
        }

        return <>{routes}</>
      })}
      <Route path="*" element={<Content />} />
    </Routes>
  );
}

export default ShowPages;
