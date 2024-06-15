import { NodeInformation } from "../nodes/types/NodeInformation.ts";


interface NodesProps {
    // we can probably remove this fetching data early is kind of unnecassary.
    nodes: NodeInformation[],
    // useGraphScrolling?: boolean,
}

function GuidanceControl({ }: Readonly<NodesProps>) {
    return (
        <></>
    );
}

export default GuidanceControl;
