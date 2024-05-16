import { Grid, } from "@mui/material";
import { NodeInformation } from "../nodes/types/NodeInformation.ts";
import ObjectEntryEditPaper from "../object_entry/vis/ObjectEntryEditPaper.tsx";

interface NodesProps {
  nodes: NodeInformation[],
}

function MotorControl({ nodes : _ }: NodesProps) {

  return (
    <Grid container spacing={2} padding={2}
      direction="row"
      justifyContent={"space-between"}>
      <Grid item xs>
        <ObjectEntryEditPaper title="mcu_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
      <Grid item xs>
        <ObjectEntryEditPaper title="magnet_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
      <Grid item xs>
        <ObjectEntryEditPaper title="mosfet_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
      <Grid item xs>
        <ObjectEntryEditPaper title="cooling_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
      <Grid item xs>
        <ObjectEntryEditPaper title="cooling_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
      <Grid item xs>
        <ObjectEntryEditPaper title="cooling_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
      <Grid item xs>
        <ObjectEntryEditPaper title="cooling_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
      <Grid item xs>
        <ObjectEntryEditPaper title="cooling_temperature" nodeName="motor_driver" objectEntryName="build_time" />
      </Grid>
    </Grid>
  );
}

export default MotorControl;
