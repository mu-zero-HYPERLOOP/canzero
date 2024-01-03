import {NodeInformation} from "../types/NodeInformation.ts";
import ObjectEntryPanel from "./ObjectEntryPanel.tsx";

interface NodesProps {
    nodes: NodeInformation[];
}

function LevitationControl({nodes}: NodesProps) {

    return (
        <>
            <h1>Levitation Control</h1>
            {nodes.map((entry: NodeInformation) => {
                if (entry.name === "secu")
                    return (<>
                            <ObjectEntryPanel node={entry} name={"levitation_state"}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_0"}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_1"}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_2"}/>
                            <ObjectEntryPanel node={entry} name={"pressure_sensor_3"}/>
                        </>
                    )
            })}
        </>
    );
}

export default LevitationControl;