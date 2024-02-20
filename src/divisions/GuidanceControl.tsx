import { Box, Paper, Stack } from "@mui/material";
import { NodeInformation } from "../nodes/types/NodeInformation.ts";
import TemperatureVis from "../visualizations/temperature/TemperatureVis.tsx";
import StateVis from "../visualizations/state/StateVis.tsx";
import SimpleEnumDisplay from "../object_entry/vis/SimpleEnumDisplay.tsx";

interface NodesProps {
  // we can probably remove this fetching data early is kind of unnecassary.
  nodes: NodeInformation[],
  // useGraphScrolling?: boolean,
}

function GuidanceControl({ }: NodesProps) {
  return (
    <Stack>
      <Stack direction="row">
        <TemperatureVis />
        <StateVis />
      </Stack>
      <Box component="div">
      <Paper sx={{
        padding : 2,
        margin : 2,
        display : "flex",
        justifyContent: "space-between",
      }}>
        <SimpleEnumDisplay nodeName="mlu1" objectEntryName="state" />
        <SimpleEnumDisplay nodeName="mlu2" objectEntryName="state" />
        <SimpleEnumDisplay nodeName="mlu3" objectEntryName="state" />
        <SimpleEnumDisplay nodeName="mlu4" objectEntryName="state" />
        <SimpleEnumDisplay nodeName="mlu5" objectEntryName="state" />
        <SimpleEnumDisplay nodeName="mlu6" objectEntryName="state" />
      </Paper>
      <Paper sx={{
        padding : 2,
        margin : 2,
        display : "flex",
        justifyContent: "space-around",
      }}>
        <SimpleEnumDisplay nodeName="mgu1" objectEntryName="state" />
        <SimpleEnumDisplay nodeName="mgu2" objectEntryName="state" />
      </Paper>
      <Paper sx={{
        padding : 2,
        margin : 2,
        display : "flex",
        justifyContent: "space-around",
      }}>
        <SimpleEnumDisplay nodeName="motor_driver" objectEntryName="state" />
      </Paper>
      <Paper sx={{
        padding : 2,
        margin : 2,
        display : "flex",
        justifyContent: "space-around",
      }}>
        <SimpleEnumDisplay nodeName="master" objectEntryName="mlu_command" />
        <SimpleEnumDisplay nodeName="master" objectEntryName="mgu_command" />
        <SimpleEnumDisplay nodeName="master" objectEntryName="motor_command" />
      </Paper>
      </Box>
    </Stack>
  );
}

export default GuidanceControl;
