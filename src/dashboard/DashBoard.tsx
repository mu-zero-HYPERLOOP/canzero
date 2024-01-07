import * as React from 'react';
import {useEffect, useState} from 'react';
import {styled,} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar, {AppBarProps as MuiAppBarProps} from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ShowPages from './ShowPages.tsx';
import {ListEntries} from './PageList.tsx';
import ControlBar, {abort, connect, emergency, launch, levitate, prepare, States} from "../overview/ControlBar.tsx";
import {yellow} from "@mui/material/colors";
import EstablishConnection from "./EstablishConnection.tsx";
import interpolate from "color-interpolate";

const drawerWidth: number = 220;

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

interface CustomAppBarProps {
    connectingPossible: boolean;
    connectionSuccess: boolean;
    setConnectingPossible: (isConnecting: boolean) => void;
    setConnectionSuccess: (isConnecting: boolean) => void;
    state: States;
    setState: (state: States) => void;
    open: boolean;
    toggleDrawer: () => void;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({theme, open}) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, {shouldForwardProp: (prop) => prop !== 'open'})(
    ({theme, open}) => ({
        '& .MuiDrawer-paper': {
            position: 'relative',
            whiteSpace: 'nowrap',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            boxSizing: 'border-box',
            ...(!open && {
                overflowX: 'hidden',
                transition: theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen,
                }),
                width: theme.spacing(7),
                [theme.breakpoints.up('sm')]: {
                    width: theme.spacing(7.5),
                },
            }),
        },
    }),
);

function CustomAppBar({
                          connectingPossible,
                          connectionSuccess,
                          setConnectingPossible,
                          setConnectionSuccess,
                          state,
                          setState,
                          open,
                          toggleDrawer
                      }: Readonly<CustomAppBarProps>) {
    const [color, setColor] = useState<string>('#D11F04')

    function getColor(value: number, color1: string, color2: string) {
        let colormap = interpolate([color1, color2]);
        let percent = (value) / (2000)
        return colormap(percent)
    }

    useEffect(() => {
        if (connectingPossible) {
            let count = 0
            const intervalId = setInterval(() => {
                count += 20
                setColor(getColor(count, color, yellow[500]))
                if (count === 2000) {
                    clearInterval(intervalId);
                }
            }, 20);
        } else if (connectionSuccess) {
            let count = 0
            const intervalId = setInterval(() => {
                count += 20
                setColor(getColor(count, color, '#2E9B33'))
                if (count === 2000) {
                    clearInterval(intervalId);
                }
            }, 20);
        } else {
            let count = 0
            const intervalId = setInterval(() => {
                count += 20
                setColor(getColor(count, color, '#D11F04'))
                if (count === 2000) {
                    clearInterval(intervalId);
                }
            }, 20);
        }

    }, [connectingPossible, connectionSuccess]);

    return (<AppBar position="absolute" open={open} sx={{backgroundColor: color}}>
        <Toolbar
            sx={{
                pr: '24px', // keep right padding when drawer closed
            }}
        >
            <IconButton
                edge="start"
                aria-label="open drawer"
                onClick={toggleDrawer}
                sx={{
                    marginRight: '36px',
                    ...(open && {display: 'none'}),
                    backgroundColor: "black",
                    color: "#00d6ba",
                    '&:hover': {
                        backgroundColor: "#232323"
                    }
                }}
            >
                <MenuIcon/>
            </IconButton>
            <ControlBar connectingPossible={connectingPossible} setConnectingPossible={setConnectingPossible}
                        setConnectionSuccess={setConnectionSuccess} state={state} setState={setState}/>
            <EstablishConnection setConnectingPossible={setConnectingPossible}/>
        </Toolbar>
    </AppBar>)
}


export default function Dashboard() {
    const [open, setOpen] = React.useState(true);
    const [connectingPossible, setConnectingPossible] = useState(false);
    const [connectionSuccess, setConnectionSuccess] = useState<boolean>(false)
    const [state, setState] = useState<States>(States.Startup)

    const toggleDrawer = () => {
        setOpen(!open);
    };

    useEffect(() => {
        const keyDownHandler = (event: { key: string; preventDefault: () => void; }) => {
            if (event.key === ' ') {
                event.preventDefault()
                emergency(setConnectingPossible, setState)
            } else if (event.key === "F1") { //TODO Somebody test please, mac does not like overwriting this
                event.preventDefault()
                connect(setConnectingPossible, setConnectionSuccess)
            } else if (event.key === "F2") {
                event.preventDefault()
                prepare(state, setState)
            } else if (event.key === "F3") {
                event.preventDefault()
                levitate(setState)
            } else if (event.key === "F4") {
                event.preventDefault()
                launch(setState)
            } else if (event.key === "F5") {
                event.preventDefault()
                abort(state, setState)
            }
        };

        document.addEventListener('keydown', keyDownHandler);

        return () => {
            document.removeEventListener('keydown', keyDownHandler);
        };
    }, []);

    return (
        <Box sx={{display: 'flex'}}>
            <CssBaseline/>
            <CustomAppBar connectingPossible={connectingPossible} connectionSuccess={connectionSuccess}
                          setConnectingPossible={setConnectingPossible} setConnectionSuccess={setConnectionSuccess}
                          state={state} setState={setState} open={open} toggleDrawer={toggleDrawer}/>
            <Drawer variant="permanent" open={open}>
                <Toolbar
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        px: [1],
                        m: 0.4
                    }}
                >
                    <IconButton onClick={toggleDrawer}>
                        <ChevronLeftIcon/>
                    </IconButton>
                </Toolbar>
                <Divider/>
                <List component="nav">
                    <ListEntries open={open}/>
                </List>
            </Drawer>
            <Box
                component="main"
                sx={{
                    backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                            ? theme.palette.grey[100]
                            : theme.palette.grey[900],
                    flexGrow: 1,
                    height: '100vh',
                    overflow: 'auto',
                }}
            >
                <Toolbar/>
                <Box sx={{width: '100%'}}>
                    <ShowPages connectionSuccess={connectionSuccess}/>
                </Box>
            </Box>
        </Box>
    );
}
