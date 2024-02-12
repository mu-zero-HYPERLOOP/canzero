import {NodeInformation} from "../nodes/types/NodeInformation.ts";

interface NodesProps {
    nodes: NodeInformation[],
    useGraphScrolling?: boolean,
}

function MotorControl({nodes, useGraphScrolling = false}: NodesProps) {

    return (
        <>
            <h1>Motor Control</h1>
            {nodes.map((entry: NodeInformation) => {
                if (entry.name === "secu")
                    return (<>
                        </>
                    )
            })}
        </>
    );
}

export default MotorControl;
