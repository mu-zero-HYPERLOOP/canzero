import { Stack } from "@mui/material";
import TemperatureVis from "../dashboard/temperature_vis/TemperatureVis.tsx";
import {NodeInformation} from "../nodes/types/NodeInformation.ts";

interface NodesProps {
    nodes: NodeInformation[],
    // useGraphScrolling?: boolean,
}

function GuidanceControl({nodes}: NodesProps) {

    return (
    <Stack direction="row">
      <TemperatureVis/>
      <TemperatureVis/>
      <TemperatureVis/>
    </Stack>
    );
}

export default GuidanceControl;
