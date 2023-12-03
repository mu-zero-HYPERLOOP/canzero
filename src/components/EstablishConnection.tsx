import Box from "@mui/material/Box";
import {CircularProgress, Fab} from "@mui/material";
import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api";
import CheckIcon from '@mui/icons-material/Check';
import {green, red, yellow} from "@mui/material/colors";
import SyncIcon from '@mui/icons-material/Sync';
import ErrorIcon from '@mui/icons-material/ErrorOutline';


export function EstablishConnection() {
    const [connecting, setConnecting] = useState<boolean>(true);
    const [sucess, setSucess] = useState<boolean>(false)

    async function asyncConnect() {
        await invoke("connect_pod");
        setSucess(true)
        setConnecting(false)
    }

    useEffect(() => {
        asyncConnect().catch(() => {
            setConnecting(false)
        })
    }, []);

    const sx = {
        ...((!connecting && sucess && {
            bgcolor: '#2E9B33',
            '&:hover': {
                bgcolor: green[800],
            },
        }) || (!connecting && !sucess && {
            bgcolor: '#E32E13',
            '&:hover': {
                bgcolor: red[800],
            },
        })),
    };

    return (<Box sx={{display: 'flex', alignItems: 'center', width: 180}}>
        <Box sx={{m: 1, position: 'relative'}}>
            {(connecting && <>Connecting...</>) || (!connecting && sucess && <>Connected</>) || (!connecting && !sucess && <>Failed!</>)}
        </Box>
        <Box sx={{m: 1, position: 'relative'}}>
            <Fab
                aria-label="save"
                color="secondary"
                sx={sx}
                size="medium"
            >
                {(connecting && <SyncIcon/>) || (!connecting && sucess && <CheckIcon/>) || (!connecting && !sucess && <ErrorIcon/>)}
            </Fab>
            {connecting && (
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
    </Box>)
}