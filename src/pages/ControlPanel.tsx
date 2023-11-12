import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { invoke } from '@tauri-apps/api';

function ControllButtons() {
    return (
        <Stack direction="row" spacing={4}>
             {/*Add icons*/}
            <Button variant="contained" size="large" color="error" onClick={() => {
                invoke('emergency');
            }}>Emergency</Button>
            <Button variant="contained" size="large" color="success" onClick={() => {
                invoke('launch_pod');
            }}>Launch</Button>
            <Button variant="contained" size="large" onClick={() => {
                invoke('land_pod');
            }}>Land</Button>
        </Stack>
    );
}

function ControlPanel() {
    return (<div>
        <ControllButtons/>
    </div>);
};

export default ControlPanel;