import PodTemperatures from './ValueTable.tsx';
import {Grid, Paper, Skeleton, Stack, styled} from '@mui/material';
import BMW from '../assets/bmw_m4.glb?url';
import {PresentationControls, Stage, useGLTF} from '@react-three/drei';
import {Canvas} from "@react-three/fiber";
import {JSX} from 'react/jsx-runtime';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCarBattery, faTriangleExclamation} from '@fortawesome/free-solid-svg-icons';
import Thermostat from '@mui/icons-material/Thermostat';
import Bolt from '@mui/icons-material/Bolt';
import Box from "@mui/material/Box";
import {NodeInformation} from "../nodes/types/NodeInformation.ts";

const Item = styled(Paper)(({theme}) => ({
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
                <FontAwesomeIcon icon={faTriangleExclamation} fontSize="40px"/>
                <div/>
                Warning
            </Box>
            <Box component="form">
                <FontAwesomeIcon icon={faCarBattery} fontSize="40px"/>
                <div/>
                Battery
            </Box>
            <Box component="form">
                <Thermostat sx={{fontSize: "42px"}}/>
                <div style={{marginBottom: "-6px"}}/>
                Temperature
            </Box>
            <Box component="form">
                <Bolt sx={{fontSize: "42px"}}/>
                <div style={{marginBottom: "-6px"}}/>
                Electric
            </Box>
            </Stack>
    )
}

function Model(props: JSX.IntrinsicAttributes & { [properties: string]: any; }) {
    const {scene} = useGLTF(BMW);
    return <primitive object={scene} scale={0.01} {...props} />;
}

function Pod3DModel() {
    return (
        <Canvas dpr={[1, 2]} shadows camera={{fov: 45}}>
            <PresentationControls global speed={1.5} zoom={0.5} polar={[-Math.PI, Math.PI]}>
                <Stage environment={null} shadows={true}>
                    <Model scale={0.01}/>
                </Stage>
            </PresentationControls>
        </Canvas>
    );
}

function ControlGrid({connectionSuccess, nodes}: Readonly<ControlGridProps>) {
    return (
        <Grid container rowSpacing={2} columnSpacing={{xs: 1, md: 2}} sx={{margin: "1%"}}>
            {!connectionSuccess ? (
                <>
                    <Grid item xs={6} md={12}>
                        <Skeleton variant="rounded" width="49.5%" height="72px"/>
                    </Grid>
                    <Grid item xs={6} md={6}>
                        <Skeleton variant="rounded" width="100%" height="300px"/>
                    </Grid>
                    <Grid item xs={6} md={6}>
                        <Skeleton variant="rounded" width="100%" height="300px"/>
                    </Grid>
                    <Grid item xs={6} md={4}>
                        <Skeleton variant="rounded" width="100%" height="300px"/>
                    </Grid>
                    <Grid item xs={6} md={8}>
                        <Skeleton variant="rounded" width="100%" height="300px"/>
                    </Grid>
                </>
            ) : (
                <>
                    <Grid item xs={6} md={12}>
                        <Item sx={{width: "49.5%", height: "72px"}}>
                            <ControlLights/>
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={6}>
                        <Item sx={{width: "100%", height: "300px"}}>
                            3D Pod Model
                            <Pod3DModel/>
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={6}>
                        <Item sx={{width: "100%", height: "300px"}}>
                            Table 01
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={4}>
                        <Item sx={{width: "100%", height: "300px"}}>
                            Table 02
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={8}>
                        <Item sx={{width: "100%", height: "300px"}}>
                            Table 03
                        </Item>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Item sx={{width: "100%"}}>
                            <PodTemperatures nodes={nodes} width={700} height={100}/>
                        </Item>
                    </Grid>
                </>
            )}
        </Grid>
    );
}

export default ControlGrid;