import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {invoke} from '@tauri-apps/api';
import ControlTable from '../components/ControlTable';
import {Container} from '@mui/material';
import {useEffect} from "react";
import { Grid, Paper, Box, styled } from '@mui/material';

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

function ControllButtons() {
    return (
        <Stack
            direction="row"
            justifyContent="space-around"
            alignItems="center"
            spacing={2}
        >
            {/*Add icons*/}
            <Button variant="contained" size="large"
                    style={{maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px'}} color="error"
                    onClick={() => {
                        invoke('emergency');
                    }}>Emergency</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px'}} color="success"
                    onClick={() => {
                        invoke('launch_pod');
                    }}>Launch</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px'}}
                    onClick={() => {
                        invoke('land_pod');
                    }}>Land</Button>
        </Stack>
    );
}

function OverviewPanel() {

    useEffect(() => {
        const keyDownHandler = (event: { key: string; preventDefault: () => void; }) => {
            if (event.key === ' ') {
                event.preventDefault();
                invoke('emergency');
            }
        };

        document.addEventListener('keydown', keyDownHandler);

        return () => {
            document.removeEventListener('keydown', keyDownHandler);
        };
    }, []);

    return (
        <div>
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
                <ControllButtons/>
            </Container>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, md: 2 }} sx={{ margin: "1%"}}>
                <Grid item xs={12} md={12}>
                </Grid>
                <Grid item xs={6} md={8}>
                    <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={4}>
                    <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={4}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={8}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={6} md={4}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
                <Grid item xs={12} md={12}>
                <Item sx={{ width: "100%", height: "300px"}}>
                        xs=6 md=8
                    </Item>
                </Grid>
            </Grid>
        </div>

    );
}

export default OverviewPanel;

{/*<>
<Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
    <ControllButtons/>
</Container>
<Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
    <ControlTable/>
</Container>
</>*/}