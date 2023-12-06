import {invoke} from '@tauri-apps/api';
import {Container, Button, Stack, Box} from '@mui/material';
import {useEffect, useState } from "react";
import ControlGrid from '../components/ControlGrid';
import EstablishConnection from '../components/EstablishConnection';

function OverviewPanel() {
    const [isConnecting, setIsConnecting] = useState(true);

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

    function ControlButtons() {

        return (
            <>        
                <Stack
                    direction="row"
                    justifyContent="start"
                    alignItems="center"
                    spacing={5}
                >
                    {/* Buttons */}
                    <Button variant="contained" size="large"
                            style={{ maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px' }} color="error"
                            onClick={() => {
                                invoke('emergency');
                            }}>Emergency</Button>
                    <Button variant="contained" size="large"
                            style={{ maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px' }} color="success"
                            onClick={() => {
                                invoke('launch_pod');
                            }}>Launch</Button>
                    <Button variant="contained" size="large"
                            style={{ maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px' }}
                            onClick={() => {
                                invoke('land_pod');
                            }}>Land</Button>
    
                    <Box sx={{ flexGrow: 1 }}></Box>
    
                    <EstablishConnection isConnecting={isConnecting} setIsConnecting={setIsConnecting} />
                </Stack>
            </>
        );
    }

    return (
        <div>
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
                <ControlButtons/>
            </Container>
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
                <ControlGrid isConnecting={isConnecting} />
            </Container>
        </div>

    );
}

export default OverviewPanel;