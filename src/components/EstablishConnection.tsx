import Box from "@mui/material/Box";
import {CircularProgress, Fab } from "@mui/material";
import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import CheckIcon from '@mui/icons-material/Check';
import {green, red, yellow} from "@mui/material/colors";
import SyncIcon from '@mui/icons-material/Sync';
import ErrorIcon from '@mui/icons-material/ErrorOutline';

interface EstablishConnectionProps {
    isConnecting: boolean;
    setIsConnecting: (isConnecting: boolean) => void;
}

function EstablishConnection({ isConnecting, setIsConnecting }: EstablishConnectionProps) {
    const [success, setSuccess] = useState<boolean>(false)

    async function asyncConnect() {
        try {
            await invoke("connect_pod");
            setSuccess(true)
        } catch(error) {
            // TODO: handle error
        } finally {
            setIsConnecting(false)
        }
    }

    useEffect(() => {
        asyncConnect();
    }, []);

    const sx = {
        ...((success && {
            bgcolor: '#2E9B33',
            '&:hover': {
                bgcolor: green[800],
            },
        }) || (!success && {
            bgcolor: '#E32E13',
            '&:hover': {
                bgcolor: red[800],
            },
        })),
    };

    return (
        <Box sx={{display: 'flex', alignItems: 'center', width: 180}}>
            <Box sx={{m: 1, position: 'relative'}}>
            {(isConnecting && <>Connecting...</>) || (!isConnecting && success && <>Connected</>) || (!isConnecting && !success && <>Failed!</>)}
            </Box>
            <Box sx={{m: 1, position: 'relative'}}>
                <Fab
                    aria-label="save"
                    color="secondary"
                    sx={sx}
                    size="medium" >
                    {(isConnecting && <SyncIcon/>) || (!isConnecting && success && <CheckIcon/>) || (!isConnecting && !success && <ErrorIcon/>)}
                </Fab>
                {isConnecting && (
                    <CircularProgress
                        size={57}
                        sx={{
                            color: yellow[500],
                            position: 'absolute',
                            top: -4.5,
                            left: -4.5,
                            zIndex: 1,
                        }}
                    />
                )}
            </Box>
        </Box>
    );
}
export default EstablishConnection;