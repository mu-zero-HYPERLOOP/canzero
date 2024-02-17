import {NodeInformation} from "../nodes/types/NodeInformation.ts";

interface NodesProps {
    nodes: NodeInformation[],
}

function MotorControl({nodes}: NodesProps) {

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
