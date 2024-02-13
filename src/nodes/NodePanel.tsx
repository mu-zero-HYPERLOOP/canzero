import { NodeInformation } from "./types/NodeInformation.ts";

interface NodePanelProps {
  node : NodeInformation
}

function NodePanel({node} : NodePanelProps) {
    return <h1>Hello {node.name}</h1>;
}

export default NodePanel
