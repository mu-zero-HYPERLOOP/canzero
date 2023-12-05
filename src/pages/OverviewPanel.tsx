import {invoke} from '@tauri-apps/api';
import {Container, Button, Stack} from '@mui/material';
import {useEffect} from "react";
import ControlGrid from '../components/ControlGrid';
import { EstablishConnection } from '../components/EstablishConnection';

function ControllButtons() {
    return (
        <>        
            <Stack
                direction="row"
                justifyContent="start"
                alignItems="center"
                spacing={5} >
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
                        style={{maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px', marginRight: "20%"}}
                        onClick={() => {
                            invoke('land_pod');
                        }}>Land</Button>
                
                <EstablishConnection />
            </Stack>
        </>
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
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
                <ControlGrid />
            </Container>
        </div>

    );
}

export default OverviewPanel;