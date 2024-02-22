import { Box, Paper, Stack } from "@mui/material";
import { NodeInformation } from "../nodes/types/NodeInformation.ts";
import TemperatureVis from "../visualizations/temperature/TemperatureVis.tsx";
import StateVis from "../visualizations/state/StateVis.tsx";
import ObjectEntryList from "../object_entry/vis/list/ObjectEntryList.tsx";
import EnumListEntry from "../object_entry/vis/list/EnumListEntry.tsx";
import NumberListEntry from "../object_entry/vis/list/NumberListEntry.tsx";
import SdcVis from "../visualizations/sdc/SdcVis.tsx";

interface NodesProps {
  // we can probably remove this fetching data early is kind of unnecassary.
  nodes: NodeInformation[],
  // useGraphScrolling?: boolean,
}

function GuidanceControl({ }: NodesProps) {
  return (
    <Stack>
      <Stack direction="row" sx={{
        marginTop: "20px",
        marginLeft: 2,
        marginRight: 2,
        height: "50px",
        alignItems : "center",
        justifyContent: "space-between",
      }}>
        <Stack direction="row">
        Hello World!
        </Stack>
        <Paper sx={{
          width: "50%",
        }}>
          <SdcVis />
        </Paper>
      </Stack>
      <Stack direction="row" sx={{
        justifyContent: "space-around",
      }}>
        <TemperatureVis />
        <StateVis />
        <Paper sx={{
          margin: 2,
          padding: 1,
          width: "100%",
        }}>
          Work in progress
        </Paper>
      </Stack>
      <Stack direction="row" sx={{
        justifyContent: "space-around",
        width: "100%",
      }}>
        <ObjectEntryList
          sx={{ width: "100%" }}
          label="MLU-State"
        >
          <EnumListEntry label="command" nodeName="master" objectEntryName="mlu_command" />
          <EnumListEntry label="mlu1-state" nodeName="mgu1" objectEntryName="state" />
          <EnumListEntry label="mlu2-state" nodeName="mgu2" objectEntryName="state" />
          <EnumListEntry label="mlu3-state" nodeName="mgu3" objectEntryName="state" />
          <EnumListEntry label="mlu4-state" nodeName="mgu4" objectEntryName="state" />
          <EnumListEntry label="mlu5-state" nodeName="mgu5" objectEntryName="state" />
          <EnumListEntry label="mlu6-state" nodeName="mgu6" objectEntryName="state" />
        </ObjectEntryList>


        <ObjectEntryList
          sx={{ width: "100%" }}
          label="MGU-State"
        >
          <EnumListEntry label="command" nodeName="master" objectEntryName="mgu_command" />
          <EnumListEntry label="mgu1-state" nodeName="mgu1" objectEntryName="state" />
          <EnumListEntry label="mgu2-state" nodeName="mgu2" objectEntryName="state" />
        </ObjectEntryList>

        <ObjectEntryList
          sx={{ width: "100%" }}
          label="Motor-State"
        >
          <EnumListEntry label="command" nodeName="master" objectEntryName="motor_command" />
          <EnumListEntry label="state" nodeName="motor_driver" objectEntryName="state" />
        </ObjectEntryList>

        <ObjectEntryList
          sx={{ width: "100%" }}
          label="MLU-Airgaps"
        >
          <NumberListEntry label="mlu1-airgap" nodeName="mlu1" objectEntryName="air_gap" />
          <NumberListEntry label="mlu2-airgap" nodeName="mlu2" objectEntryName="air_gap" />
          <NumberListEntry label="mlu3-airgap" nodeName="mlu3" objectEntryName="air_gap" />
          <NumberListEntry label="mlu4-airgap" nodeName="mlu4" objectEntryName="air_gap" />
          <NumberListEntry label="mlu5-airgap" nodeName="mlu5" objectEntryName="air_gap" />
          <NumberListEntry label="mlu6-airgap" nodeName="mlu6" objectEntryName="air_gap" />
        </ObjectEntryList>

        <ObjectEntryList
          sx={{ width: "100%" }}
          label="MGU-Airgaps"
        >
          <NumberListEntry label="mgu1-airgap-star" nodeName="mgu1" objectEntryName="TODO" />
          <NumberListEntry label="mgu1-airgap-port" nodeName="mgu1" objectEntryName="TODO" />
          <NumberListEntry label="mgu2-airgap-star" nodeName="mgu2" objectEntryName="TODO" />
          <NumberListEntry label="mgu2-airgap-port" nodeName="mgu2" objectEntryName="TODO" />
        </ObjectEntryList>
        <ObjectEntryList
          sx={{ width: "100%" }}
          label="Position Estimation"
        >
          <NumberListEntry label="acceleration" nodeName="motor_driver" objectEntryName="local_acceleration" />
          <NumberListEntry label="velocity" nodeName="input_board" objectEntryName="TODO" />
          <NumberListEntry label="position" nodeName="input_board" objectEntryName="TODO" />
        </ObjectEntryList>

      </Stack>
    </Stack>
  );
}

export default GuidanceControl;
