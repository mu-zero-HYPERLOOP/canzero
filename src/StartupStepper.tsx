import { Alert, AlertTitle, Box, IconButton, LinearProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Step, StepContent, StepLabel, Stepper, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import LanIcon from '@mui/icons-material/Lan';
import CellTowerIcon from '@mui/icons-material/CellTower';
import { invoke } from "@tauri-apps/api";


enum ConnectionState {
  Init,
  Error,
  Searching,
  FoundServers,
  Connecting,
};

// enum SetupState {
//   Progess,
//   Error,
//   Success,
// }

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

function StartupStepper() {
  const [activeStep, setActiveStep] = useState(0);

  const [connections, setConnections] = useState<ConnectionDescription[]>([]);

  const [configError, setConfigError] = useState<ConfigError>(null);
  const [connectionError, setConnectionError] = useState<ConnectionError>(null);
  const [setupError, setSetupError] = useState<SetupError>(null);

  const [activeConnection, setActiveConnection] = useState<string>();

  const [connectionState, setConnectionState] = useState(ConnectionState.Init);

  const theme = useTheme();

  useEffect(() => {
    switch (activeStep) {
      case 0: // Building Network Configuration
        console.log("download_network_configuration");
        invoke("download_network_configuration", {}).then(() => {
          console.log("set active step");
          setActiveStep(1);
        }).catch(err => {
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
        invoke("complete_setup", {}).then(()=> {
          setActiveStep(3);
          setSetupError(null);
        }).catch(err=>{
          console.log("error");
          setSetupError(err);
        });
        break;
    }
    // register to listener in the backend 
  }, [activeStep, connectionState]);
  console.log("rerender");

  function reset() {null
    setActiveStep(0);
    setConnectionState(ConnectionState.Init);
    setConfigError(null);
    setConnectionError(null);
    setSetupError(null);
    setConnections([]);
    setActiveConnection(undefined);
  }

  return (
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
                          backgroundColor: theme.palette.background.appBar,
                          margin: 0,
                        }} disablePadding>
                          {
                            connections.map((connection, index) => {
                              return (
                                <ListItem>
                                  <ListItemButton key={index} onClick={() => {
                                    invoke("try_connect", { connectionIndex: index }).then(()=> {
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
  );

}

export default StartupStepper;
