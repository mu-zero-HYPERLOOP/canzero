import PodTemperatures from './PodTemperatures';
import { Grid, Paper, Skeleton, styled } from '@mui/material';
import BMW from '../assets/bmw_m4.glb?url';
import {PresentationControls, Stage, useGLTF} from '@react-three/drei';
import {Canvas} from "@react-three/fiber";
import { JSX } from 'react/jsx-runtime';

const Item = styled(Paper)(({theme}) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
}));

interface ControlGridProps {
    connectionSuccess: boolean;
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
                    <Model scale={0.01}/>
                </Stage>
            </PresentationControls>
        </Canvas>
    );
}

function ControlGrid({ connectionSuccess }: ControlGridProps) {
    return (
        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, md: 2 }} sx={{ margin: "1%" }}>
            {!connectionSuccess ? (
                <>
                    {Array.from({ length: 4 }, (_, index) => (
                        <Grid item xs={6} md={(index % 4 === 0 || index % 4 === 3) ? 8 : 4} key={index}>
                            <Skeleton variant="rounded" width="100%" height="300px" />
                        </Grid>
                    ))}
                </>
            ) : (
                <>
                    <Grid item xs={6} md={8}>
                        <Item sx={{ width: "100%", height: "300px" }}>
                            3D Pod Model
                            <Pod3DModel/>
                        </Item>
                    </Grid>
                    <Grid item xs={6} md={4}>
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
                            Table 03
                        </Item>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Item sx={{ width: "100%" }}>
                            <PodTemperatures />
                        </Item>
                    </Grid>
                </>
            )}
        </Grid>
    );
}

export default ControlGrid;