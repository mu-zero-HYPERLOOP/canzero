import { Alert, AlertTitle, AppBar, Box, Container, CssBaseline, IconButton, LinearProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Stack, Step, StepContent, StepLabel, Stepper, Toolbar, Typography, useTheme } from "@mui/material";
import AccessibleIcon from '@mui/icons-material/Accessible';
import LanIcon from '@mui/icons-material/Lan';
import CellTowerIcon from '@mui/icons-material/CellTower';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { invoke } from "@tauri-apps/api";
import { useEffect, useState } from "react";

import { Checkbox } from "@mui/material";
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';

enum ConnectionState {
  Init,
  Error,
  Searching,
  FoundServers,
  Connecting,
}

enum ConnectionType {
  SocketCan = 0,
  Tcp = 1,
}

interface ConnectionDescription {
  tag: ConnectionType,
  description: string,
}

type ConfigError = null | string;

type ConnectionError = null | string;

type SetupError = null | string;

interface StartupConnectionProps {
  onSettings: () => any;
};

function StartupConnection({ onSettings }: StartupConnectionProps) {
  const theme = useTheme();

  const [activeStep, setActiveStep] = useState(0);

  const [connections, setConnections] = useState<ConnectionDescription[]>([]);

  const [configError, setConfigError] = useState<ConfigError>(null);
  const [connectionError, setConnectionError] = useState<ConnectionError>(null);
  const [setupError, setSetupError] = useState<SetupError>(null);

  const [activeConnection, setActiveConnection] = useState<string>();

  const [connectionState, setConnectionState] = useState(ConnectionState.Init);

  useEffect(() => {
    switch (activeStep) {
      case -1:
      case 0: // Building Network Configuration
        console.log("download_network_configuration");
        invoke("download_network_configuration", {}).then(() => {
          console.log("set active step");
          setActiveStep(1);
        }).catch(err => {
          setActiveStep(0);
          setConfigError(err);
        });
        break;
      case 1: // Connect to network
        if (connectionState == ConnectionState.Init) {
          setConnectionState(ConnectionState.Searching);
          invoke<ConnectionDescription[]>("discover_servers", {}).then(connections => {
            if (connections.length == 0) {
              setConnectionError("No Servers found");
              setConnectionState(ConnectionState.Error);
            } else {
              console.log("connections", connections);
              setConnectionState(ConnectionState.FoundServers);
            }
            setConnections(connections);
          }).catch(err => {
            setConnectionError(err);
          });

        }
        break;
      case 2: // Start Control Panel
        invoke("complete_setup", {}).then(() => {
          setActiveStep(3);
          setSetupError(null);
        }).catch(err => {
          console.log("error");
          setSetupError(err);
        });
        break;
    }
    // register to listener in the backend 
  }, [activeStep, connectionState]);

  function reset() {
    setActiveStep(-1);
    setConnectionState(ConnectionState.Init);
    setConfigError(null);
    setConnectionError(null);
    setSetupError(null);
    setConnections([]);
    setActiveConnection(undefined);
  }

  return (
    <Box id="content" component="div" display="flex">
      <CssBaseline />
      <AppBar position="absolute" sx={{
        backgroundColor: theme.palette.background.paper2,
        height: "60px",
      }}>
        <Container component="div">
          <Toolbar disableGutters sx={{
            justifyContent: "space-between",
          }}>
            <Stack component="div" direction="row">
              <Typography variant="h5" color={theme.palette.text.secondary}>
                CANzero
              </Typography>
              <Typography marginLeft="0.5em" variant="h5" color={theme.palette.text.disabled}>
                Startup
              </Typography>
            </Stack>
            <Stack component="div" direction="row" spacing={2}>
              <IconButton onClick={reset}>
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={() => onSettings()}>
                <AccessibleIcon />
              </IconButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" sx={{
        backgroundColor: theme.palette.background.main,
        flexGrow: 1,
        minHeight: 'calc(100vh - 60px)',
        maxHeight: 'calc(100vh - 60px)',
        overflow: 'auto',
        position: "relative",
        marginTop: "60px",
      }}>
        <Box component="div" sx={{ paddingTop: 2 }}>
          <Box component="div" sx={{ maxWidth: "100%" }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step key="parse-config">
                <StepLabel>
                  Building Network Configuration
                </StepLabel>
                <StepContent>
                  {configError == null ? <LinearProgress /> : <Alert severity="warning" action={
                    <IconButton color="inherit" size="small" onClick={reset}>
                      <RefreshIcon />
                    </IconButton>
                  } sx={{
                    maxWidth: "500px"
                  }} onClick={() => {
                    console.log("retry");
                  }}><AlertTitle>Failed to build network configuration</AlertTitle>{configError}</Alert>}
                </StepContent>
              </Step>
              <Step key="connect-to-network">
                <StepLabel>
                  {activeConnection == undefined ? "Connect to Network" : `Connected to ${activeConnection}`}
                </StepLabel>
                <StepContent>
                  {(() => {
                    switch (connectionState) {
                      case ConnectionState.Init:
                        return <></>;
                      case ConnectionState.Searching:
                        return (
                          <Box component="div">
                            <Typography variant="body2">Searching...</Typography>
                            <LinearProgress />
                          </Box>
                        );
                      case ConnectionState.Error:
                        return (
                          <Alert severity={connections.length == 0 ? "warning" : "error"} action={
                            <IconButton color="inherit" size="small" onClick={reset}>
                              <RefreshIcon />
                            </IconButton>
                          } sx={{
                            maxWidth: "500px"
                          }}><AlertTitle>{connections.length == 0 ? "Failed to find Server" : "Failed to Connect"}</AlertTitle>{connectionError}</Alert>
                        );
                      case ConnectionState.FoundServers:
                        return (
                          <Paper component="div" sx={{
                            backgroundColor: theme.palette.background.paper,
                            padding: 2,
                          }}>
                            <Typography variant="body2">
                              Possible Connections
                            </Typography>
                            <List sx={{
                              backgroundColor: theme.palette.background.paper2,
                              margin: 0,
                            }} disablePadding>
                              {
                                connections.map((connection, index) => {
                                  return (
                                    <ListItem key={index}>
                                      <ListItemButton key={index} onClick={() => {
                                        invoke("try_connect", { connectionIndex: index }).then(() => {
                                          setActiveConnection(connections[index].description);
                                          setActiveStep(2);
                                        }).catch(err => {
                                          setConnectionError(err);
                                          setConnectionState(ConnectionState.Error);
                                        });
                                        setConnectionState(ConnectionState.Connecting);
                                      }}>
                                        <ListItemIcon>
                                          {connection.tag == ConnectionType.SocketCan ? <LanIcon /> : <CellTowerIcon />}
                                        </ListItemIcon>
                                        <ListItemText>
                                          {connection.description}
                                        </ListItemText>
                                      </ListItemButton>
                                    </ListItem>
                                  );
                                })
                              }
                            </List>
                          </Paper>
                        );
                      case ConnectionState.Connecting:
                        return (
                          <Box component="div">
                            <Typography variant="body2">Connecting...</Typography>
                            <LinearProgress />
                          </Box>
                        );
                      default:
                        return <></>;
                    }
                  })()}
                </StepContent>
              </Step>
              <Step key="complete-setup">
                <StepLabel>
                  Start Control Panel
                </StepLabel>
                <StepContent>
                  {setupError == null ? <LinearProgress /> : <Alert severity="error" action={
                    <IconButton color="inherit" size="small" onClick={reset}>
                      <RefreshIcon />
                    </IconButton>
                  } sx={{
                    maxWidth: "500px"
                  }} onClick={() => {
                    console.log("retry");
                  }}><AlertTitle>Fatal error during startup</AlertTitle>{setupError}.</Alert>}
                </StepContent>
              </Step>

            </Stepper>
          </Box>
        </Box>
      </Container>
    </Box >
  );
}

enum WdgLevel {
  Disable = "Disable",
  Ignore = "Ignore",
  Active = "Active",
}

interface Settings {
  configPath: string,
  frontendWdgLvl: WdgLevel,
  deadlockWdgLvl: WdgLevel,
}


interface StartupSettingsProps {
  onClose: () => any;
};

function StartupSettings({ onClose }: StartupSettingsProps) {
  const theme = useTheme();

  const [frontendLvl, setFrontendLvl] = useState<WdgLevel>(WdgLevel.Active);
  const [deadlockLvl, setDeadlockLvl] = useState<WdgLevel>(WdgLevel.Active);
  const [configPath, setConfigPath] = useState<string>();


  useEffect(() => {
    invoke<Settings>("get_settings").then(s => {
      setFrontendLvl(s.frontendWdgLvl);
      setDeadlockLvl(s.deadlockWdgLvl);
      setConfigPath(s.configPath);
    }).catch(console.error);

  }, []);

  return <Box id="content" component="div" display="flex">
    <CssBaseline />
    <AppBar position="absolute" sx={{
      backgroundColor: theme.palette.background.paper2,
      height: "60px",
    }}>
      <Container component="div">
        <Toolbar disableGutters sx={{
          justifyContent: "space-between",
        }}>
          <IconButton onClick={onClose}>
            <ArrowBackIcon />
          </IconButton>
          <Stack component="div" direction="row">
            <Typography variant="h5" color={theme.palette.text.secondary}>
              CANzero
            </Typography>
            <Typography marginLeft="0.5em" variant="h5" color={theme.palette.text.disabled}>
              Settings
            </Typography>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
    <Container component="main" sx={{
      backgroundColor: theme.palette.background.main,
      flexGrow: 1,
      minHeight: 'calc(100vh - 60px)',
      maxHeight: 'calc(100vh - 60px)',
      width: "100%",
      overflow: 'auto',
      position: "relative",
      marginTop: "60px",
    }}>
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            invoke("select_network_configuration").catch(console.error);
          }}>
            <ListItemIcon sx={{ justifyContent: "center" }}>
              <SettingsApplicationsIcon />
            </ListItemIcon>
            <ListItemText primary="Select network configuration" secondary={configPath} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon sx={{ justifyContent: "center" }}>
              <Checkbox checked={frontendLvl !== WdgLevel.Active} onChange={(evt) => {
                invoke<WdgLevel>("set_frontend_lvl", {
                  lvl: evt.target.checked ? WdgLevel.Ignore : WdgLevel.Active
                })
                  .then(i => setFrontendLvl(i))
                  .catch(console.error);
              }} />
            </ListItemIcon>
            <ListItemText
              primary="Ignore Frontend Watchdog"
              secondary="Timeout still signaled as a warining" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon sx={{ justifyContent: "center" }}>
              <Checkbox
                disabled={frontendLvl === WdgLevel.Active}
                checked={frontendLvl === WdgLevel.Disable} onChange={(evt) => {
                  invoke<WdgLevel>("set_frontend_lvl", {
                    lvl: evt.target.checked ? WdgLevel.Disable : WdgLevel.Ignore
                  })
                    .then(i => setFrontendLvl(i))
                    .catch(console.error);
                }} />
            </ListItemIcon>
            <ListItemText
              primary="Disable Frontend Watchdog"
              secondary="Danger: A frozen frontend might not lead to a shutdown" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon sx={{ justifyContent: "center" }}>
              <Checkbox checked={deadlockLvl !== WdgLevel.Active} onChange={(evt) => {
                invoke<WdgLevel>("set_deadlock_lvl", {
                  lvl: evt.target.checked ? WdgLevel.Ignore : WdgLevel.Active
                })
                  .then(i => setDeadlockLvl(i))
                  .catch(console.error);
              }} />
            </ListItemIcon>
            <ListItemText
              primary="Ignore Deadlock Watchdog"
              secondary="Timeout still signaled as a warining" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon sx={{ justifyContent: "center" }}>
              <Checkbox
                disabled={deadlockLvl === WdgLevel.Active}
                checked={deadlockLvl === WdgLevel.Disable}
                onChange={(evt) => {
                  invoke<WdgLevel>("set_deadlock_lvl", {
                    lvl: evt.target.checked ? WdgLevel.Disable : WdgLevel.Ignore
                  })
                    .then(i => setDeadlockLvl(i))
                    .catch(console.error);
                }} />
            </ListItemIcon>
            <ListItemText
              primary="Disable Deadlock Watchdog"
              secondary="Danger: A deadlocked backend might not lead to a shutdown" />
          </ListItemButton>
        </ListItem>
      </List>
    </Container>
  </Box >
}

function StartupContent() {

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  return settingsOpen ? <StartupSettings onClose={() => setSettingsOpen(false)} /> : <StartupConnection onSettings={() => setSettingsOpen(true)} />
}


export default StartupContent;
