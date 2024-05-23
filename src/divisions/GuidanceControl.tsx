import { Paper, Stack } from "@mui/material";
import { NodeInformation } from "../nodes/types/NodeInformation.ts";
import TemperatureVis from "../visualizations/temperature/TemperatureVis.tsx";
import StateVis from "../visualizations/state/StateVis.tsx";
import ObjectEntryList from "../object_entry/vis/list/ObjectEntryList.tsx";
import EnumListEntry from "../object_entry/vis/list/EnumListEntry.tsx";
import NumberListEntry from "../object_entry/vis/list/NumberListEntry.tsx";
import SdcVis from "../visualizations/sdc/SdcVis.tsx";
import PodSideView from "../visualizations/side/PodSideView.tsx";
import ErrorList from "../object_entry/vis/errors/ErrorList.tsx";

interface NodesProps {
  // we can probably remove this fetching data early is kind of unnecassary.
  nodes: NodeInformation[],
  // useGraphScrolling?: boolean,
}

function GuidanceControl({ }: NodesProps) {
  return (
    <Stack direction="column">
      <Stack direction="row" spacing={2} sx={{
        justifyContent: "space-around",
        marginTop: 2,
        marginRight : 2,
        marginLeft : 2,
      }}>
        <TemperatureVis />
        <StateVis />
        <Stack direction="column" spacing={2} justifyContent="space-between" sx={{
          width: "100%",
        }}>
          <Paper sx={{
            width: "100%",
          }}>
            <SdcVis />
          </Paper>
          <Paper sx={{
            width: "100%",
            height: "100%",
          }}>
            <PodSideView />
          </Paper>
        </Stack>
      </Stack>
      <Stack direction="row" sx={{
        justifyContent: "end",
        marginTop: 2,
        marginLeft : 2,
        marginRight : 2,
      }}>
        <ErrorList/>
      </Stack>
    </Stack>
  );
}

export default GuidanceControl;
