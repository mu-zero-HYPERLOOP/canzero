import { Stack } from "@mui/material";
import TemperatureVis from "../dashboard/temperature_vis/TemperatureVis.tsx";
import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import StateVis from "../dashboard/state_vis/StateVis.tsx";

interface NodesProps {
    nodes: NodeInformation[],
    // useGraphScrolling?: boolean,
}

function GuidanceControl({nodes}: NodesProps) {

    return (
    <Stack direction="row">
      <TemperatureVis/>
      <StateVis/>
    </Stack>
    );
}

export default GuidanceControl;
