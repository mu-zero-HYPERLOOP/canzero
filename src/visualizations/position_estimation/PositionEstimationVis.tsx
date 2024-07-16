import { Paper } from "@mui/material";
import Graph from "./Graph";


function PositionEstimationVis() {
  return (
    <Paper sx={{
      width: "50%",
      height: "25.5vh",
    }}>
      <Graph />
    </Paper>
  );

}

export default PositionEstimationVis;
