import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import {invoke} from '@tauri-apps/api';
import ControlTable from '../components/ControlTable';
import {Container} from '@mui/material';

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

function ControlPanel() {
    return (
        <>
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
            <ControllButtons/>
        </Container>
            <Container maxWidth="lg" sx={{mt: 1, mb: 1}}>
                <ControlTable/>
            </Container>
        </>
    );
};

export default ControlPanel;