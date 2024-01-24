import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import ObjectEntryPanel from "../nodes/ObjectEntryPanel.tsx";

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
                            <ObjectEntryPanel node={entry} name={"levitation_state"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_0"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_1"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_2"} 
                              useGraphScrolling={useGraphScrolling}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_3"} 
                              useGraphScrolling={useGraphScrolling}/>
                        </>
                    )
            })}
        </>
    );
}

export default LevitationControl;
