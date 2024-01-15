import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import ObjectEntryPanel from "../nodes/ObjectEntryPanel.tsx";

interface NodesProps {
    nodes: NodeInformation[];
}

function GuidanceControl({nodes}: NodesProps) {

    return (
        <>
            <h1>Guidance Control</h1>
            {nodes.map((entry: NodeInformation) => {
                if (entry.name === "secu")
                    return (<>
                            <ObjectEntryPanel node={entry} name={"guidance_state"}/>
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

export default GuidanceControl;