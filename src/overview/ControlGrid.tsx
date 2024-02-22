import { Grid, Paper, Skeleton, Stack, styled } from '@mui/material';
import BMW from '../assets/bmw_m4.glb?url';
import { PresentationControls, Stage, useGLTF } from '@react-three/drei';
import { Canvas } from "@react-three/fiber";
import { JSX } from 'react/jsx-runtime';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCarBattery, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import Thermostat from '@mui/icons-material/Thermostat';
import Bolt from '@mui/icons-material/Bolt';
import Box from "@mui/material/Box";
import { NodeInformation } from "../nodes/types/NodeInformation.ts";
import ObjectEntryGrid from "./ObjectEntryGrid.tsx";
import { ObjectEntryGridInformation } from "./types/ObjectEntryGridInformation.tsx";
import NumberListEntry from '../object_entry/vis/list/NumberListEntry.tsx';
import ObjectEntryList from '../object_entry/vis/list/ObjectEntryList.tsx';

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

interface ControlGridProps {
  connectionSuccess: boolean;
  nodes: NodeInformation[];
}


function ControlLights() {
  return (
    <Stack
      direction="row"
      justifyContent="space-evenly"
      alignItems="top"
      spacing={3}
    >
      <Box component="form">
        <FontAwesomeIcon icon={faTriangleExclamation} fontSize="40px" />
        <div />
        Warning
      </Box>
      <Box component="form">
        <FontAwesomeIcon icon={faCarBattery} fontSize="40px" />
        <div />
        Battery
      </Box>
      <Box component="form">
        <Thermostat sx={{ fontSize: "42px" }} />
        <div style={{ marginBottom: "-6px" }} />
        Temperature
      </Box>
      <Box component="form">
        <Bolt sx={{ fontSize: "42px" }} />
        <div style={{ marginBottom: "-6px" }} />
        Electric
      </Box>
    </Stack>
  )
}

function Model(props: JSX.IntrinsicAttributes & { [properties: string]: any; }) {
  const { scene } = useGLTF(BMW);
  return <primitive object={scene} scale={0.01} {...props} />;
}

function Pod3DModel() {
  return (
    <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }}>
      <PresentationControls global speed={1.5} zoom={0.5} polar={[-Math.PI, Math.PI]}>
        <Stage environment={null} shadows={true}>
          <Model scale={0.01} />
        </Stage>
      </PresentationControls>
    </Canvas>
  );
}

function createGridEntries(nodes: NodeInformation[]) {
  let entries: ObjectEntryGridInformation[] = [];
  nodes.map((node: NodeInformation) => {
    if (node.name === "mlu1") {
      entries.push({ node: node, entry: "air_gap", interpolate: true, min: 0, max: 20 })
      entries.push({ node: node, entry: "target_force", interpolate: true, min: 0, max: 100 })
      entries.push({ node: node, entry: "magnet_temperature", interpolate: true, min: -1, max: 150 })
      entries.push({ node: node, entry: "control_config", interpolate: true, min: -1, max: 150 })
    }
  });
  return entries;
}

// function createValueTableEntries(nodes: NodeInformation[]) {
//   let entries: ValueTableCellInformation[] = [];
//   nodes.map((node: NodeInformation) => {
//     if (node.name === "mlu1") {
//       entries.push({ node: node, entry: "air_gap", min: 0, max: 20 })
//       entries.push({ node: node, entry: "target_force", min: 0, max: 100 })
//       entries.push({ node: node, entry: "magnet_temperature", min: -1, max: 150 })
//     }
//   });
//   return entries;
// }

function ControlGrid({ connectionSuccess, nodes }: Readonly<ControlGridProps>) {

  return (
    <Grid container rowSpacing={2} columnSpacing={{ xs: 1, md: 2 }} sx={{ margin: "1%" }}>
      {!connectionSuccess ? (
        <>
          <Grid item xs={6} md={12}>
            <Skeleton variant="rounded" width="49.5%" height="72px" />
          </Grid>
          <Grid item xs={6} md={6}>
            <Skeleton variant="rounded" width="100%" height="300px" />
          </Grid>
          <Grid item xs={6} md={6}>
            <Skeleton variant="rounded" width="100%" height="300px" />
          </Grid>
          <Grid item xs={6} md={4}>
            <Skeleton variant="rounded" width="100%" height="300px" />
          </Grid>
          <Grid item xs={6} md={8}>
            <Skeleton variant="rounded" width="100%" height="300px" />
          </Grid>
        </>
      ) : (
        <>
          <Grid item xs={6} md={12}>
            <Item sx={{ width: "49.5%", height: "72px" }}>
              <ControlLights />
            </Item>
          </Grid>
          <Grid item xs={6} md={6}>
            <Item sx={{ width: "100%", height: "300px" }}>
              3D Pod Model
              <Pod3DModel />
            </Item>
          </Grid>
          <Grid item xs={6} md={6}>
            <Item sx={{ width: "100%", height: "300px" }}>
              Table 01
            </Item>
          </Grid>
          <Grid item xs={6} md={4}>
            <Item sx={{ width: "100%", height: "300px" }}>
              Table 02
            </Item>
          </Grid>
          <Grid item xs={6} md={8}>
            <Item sx={{ width: "100%", height: "300px" }}>
              <ObjectEntryGrid entries={createGridEntries(nodes)} width={150} />
            </Item>
          </Grid>

          <Grid item xs={12} md={6}>
            <Item sx={{ width: "350px", margin: 0,padding: 0 }}>
              <ObjectEntryList
                sx={{ width: "100%" }}
                label="MLU Temperatures"
              >
                <NumberListEntry nodeName="mlu1" objectEntryName="magnet_temperature" />
                <NumberListEntry nodeName="mlu2" objectEntryName="magnet_temperature" />
                <NumberListEntry nodeName="mlu3" objectEntryName="magnet_temperature" />
                <NumberListEntry nodeName="mlu4" objectEntryName="magnet_temperature" />
                <NumberListEntry nodeName="mlu5" objectEntryName="magnet_temperature" />
                <NumberListEntry nodeName="mlu6" objectEntryName="magnet_temperature" />
              </ObjectEntryList>
            </Item>
          </Grid>
          <Grid item xs={12} md={6}>
            <Item sx={{ width: "400px", margin: 0,padding: 0 }}>
              <ObjectEntryList
                sx={{ width: "100%" }}
                label="MGU Temperatures"
              >
                <NumberListEntry nodeName="mgu1" objectEntryName="magnet_temperature_starboard" />
                <NumberListEntry nodeName="mgu1" objectEntryName="magnet_temperature_port" />
                <NumberListEntry nodeName="mgu2" objectEntryName="magnet_temperature_starboard" />
                <NumberListEntry nodeName="mgu2" objectEntryName="magnet_temperature_port" />
              </ObjectEntryList>
            </Item>
          </Grid>
          <Grid item xs={12} md={6}>
            <Item sx={{ width: "250px", margin: 0,padding: 0 }}>
              <ObjectEntryList
                sx={{ width: "100%" }}
                label="Motor Temperatures"
              >
                <NumberListEntry label="dslim_starboard" nodeName="motor_driver" objectEntryName="magnet_temperature_starboard" />
                <NumberListEntry label="dslim_port" nodeName="motor_driver" objectEntryName="magnet_temperature_port" />
                <NumberListEntry label="mosfet" nodeName="motor_driver" objectEntryName="mosfet_temperature" />
              </ObjectEntryList>
            </Item>
          </Grid>


        </>
      )}
    </Grid>
  );
}

export default ControlGrid;
