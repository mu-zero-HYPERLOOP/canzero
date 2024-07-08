import { StaticRouter } from "react-router-dom/server";
import "./App.css";
import { MemoryRouter } from "react-router-dom";
import {
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, IconButton, Stack, Switch,
  ThemeProvider, Typography
} from "@mui/material";
import { SnackbarProvider } from "notistack";
import NotificationSystem from "./dashboard/NotificationSystem.tsx";
import React, { useEffect } from "react";
import Content from "./Content.tsx";
import theme from "./theme.ts"
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { Heartbeat } from "./heartbeat/Heartbeat.tsx";
import { appWindow } from "@tauri-apps/api/window";
import SaveIcon from "@mui/icons-material/Save";
import { exit } from '@tauri-apps/api/process';


function Router(props: Readonly<{ children?: React.ReactNode }>) {
  const { children } = props;
  if (typeof window === 'undefined') {
    return <StaticRouter location="/">{children}</StaticRouter>;
  }

  return (
    <MemoryRouter initialEntries={['/']} initialIndex={0}>
      {children}
    </MemoryRouter>
  );
}

interface CloseDialogProps {
  setLoading: (value: boolean) => void,
  open: boolean,
  onClose: (close: boolean, unregister: boolean) => void,
}
function CloseDialog({setLoading, open, onClose}: Readonly<CloseDialogProps>) {
  const [unregister, setUnregister] = React.useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUnregister(event.target.checked);
  };

  const handleCancel = () => {
    onClose(false, unregister);
  };

  const handleOk = () => {
    onClose(true, unregister);
  };
  return (
      <Dialog
          sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
          maxWidth="xs"
          open={open}
      >
        <DialogTitle>Close Control Panel</DialogTitle>
        <DialogContent dividers>
          <Stack direction="row" margin={1}>
            <Typography> Save log data: </Typography>
            <IconButton color="primary" size="medium"
                        sx={{
                          position: "relative",
                          top: "-8px",
                          left: "20px",
                          backgroundColor: theme.palette.background.paper2
                        }}
                        onClick={() => {
                          setLoading(true)
                          invoke("export_all", {}).then(() => setLoading(false));
                        }}
            >
              <SaveIcon/>
            </IconButton>
          </Stack>
          <Stack direction="row" margin={1}>
            <Typography sx={{paddingTop: "6.5px"}}> Unregister heartbeat: </Typography>
            <Switch
                checked={unregister}
                onChange={handleChange}
                inputProps={{ 'aria-label': 'controlled' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleOk} variant="contained">Ok</Button>
        </DialogActions>
      </Dialog>
  );

}

function App() {
  const [loading, setLoading] = React.useState<boolean>(false)
  const [syncDone, setSyncDone] = React.useState<boolean>(false)
  const [open, setOpen] = React.useState<boolean>(false)

  useEffect(() => {
    let unlistenJs = listen<string>("connection-status", event => {
      let state = event.payload;
      setSyncDone(state == "sync-done");
    });
    
    invoke<string>("get_connection_status").then(state => {
      setSyncDone(state == "sync-done");
    }).catch(console.error);
    
    return () => {
      unlistenJs.then(f => f()).catch(console.error);
    };
  }, []);

  useEffect(() => {
    invoke("close_startup", {}).catch(console.error);
  }, []);

  useEffect(() => {
    async function close() {
      const unlisten = await appWindow.onCloseRequested(async (event) => {
        event.preventDefault()
        setOpen(true)
      });

      return () => {
        unlisten();
      };
    }

    let asyncCleanup = close();
    return () => {
      asyncCleanup.then(f => f()).catch(console.error);
    };
  }, []);

  const handleCloseDialog = (close: boolean, unregister: boolean) => {
    setOpen(false);

    if (unregister) {
      invoke("unregister_from_heartbeat").then(() => handleClose(close))
    } else {
      handleClose(close)
    }

  };

  function handleClose(close: boolean) {
    if (close) {
       exit();
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider preventDuplicate maxSnack={7}>
        <Heartbeat />
        <NotificationSystem />
        <Router>
          <Content />
        </Router>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading || !syncDone}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <CloseDialog setLoading={setLoading} open={open} onClose={handleCloseDialog}/>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
