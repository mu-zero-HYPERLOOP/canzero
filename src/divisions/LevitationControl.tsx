import {NodeInformation} from "../nodes/types/NodeInformation.ts";

interface NodesProps {
    nodes: NodeInformation[],
    useGraphScrolling?: boolean,
}

function LevitationControl({nodes, useGraphScrolling = false}: NodesProps) {

    return (
        <>
            <h1>Levitation Control</h1>
            {nodes.map((entry: NodeInformation) => {
                if (entry.name === "secu")
                    return (<>
                        </>
                    )
            })}
        </>
    );
}

export default LevitationControl;
