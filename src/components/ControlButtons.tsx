import {Box, Button, Stack} from "@mui/material";
import {invoke} from "@tauri-apps/api";

function ControlButtons() {

    return (
        <Stack
            direction="row"
            justifyContent="start"
            alignItems="center"
            spacing={5}
        >
            {/* Buttons */}
            <Button variant="contained" size="large"
                    style={{maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px'}}
                    color="error"
                    onClick={() => {
                        invoke('emergency');
                    }}>Emergency</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px'}}
                    color="success"
                    onClick={() => {
                        invoke('launch_pod');
                    }}>Launch</Button>
            <Button variant="contained" size="large"
                    style={{maxWidth: '150px', maxHeight: '45px', minWidth: '150px', minHeight: '45px'}}
                    onClick={() => {
                        invoke('land_pod');
                    }}>Land</Button>

            <Box sx={{flexGrow: 1}}></Box>
        </Stack>
    );
}

export default ControlButtons;