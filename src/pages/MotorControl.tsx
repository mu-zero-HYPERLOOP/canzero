import {NodeInformation} from "../types/NodeInformation.ts";
import ObjectEntryPanel from "./ObjectEntryPanel.tsx";

interface NodesProps {
    nodes: NodeInformation[];
}

function MotorControl({nodes}: NodesProps) {

    return (
        <>
            <h1>Motor Control</h1>
            {nodes.map((entry: NodeInformation) => {
                if (entry.name === "secu")
                    return (<>
                            <ObjectEntryPanel node={entry} name={"cooling_state"}/>
                            <ObjectEntryPanel node={entry} name={"position"}/>
                            <ObjectEntryPanel node={entry} name={"velocity"}/>
                            <ObjectEntryPanel node={entry} name={"acceleration_x"}/>
                            <ObjectEntryPanel node={entry} name={"acceleration_y"}/>
                            <ObjectEntryPanel node={entry} name={"acceleration_z"}/>
                        </>
                    )
            })}
        </>
    );
}

export default MotorControl;