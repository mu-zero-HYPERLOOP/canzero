import CustomAppBar from "./app_bar/CustomAppBar";
import { useEffect, useState } from "react";
import SideMenu from "./side_menu/SideMenu";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, useTheme } from "@mui/material";
import ShowPages from "./dashboard/ShowPages";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";



function Content() {
  const [open, setOpen] = useState<boolean>(false);
  const [backendAvaiable, setBackendAvaiable] = useState<boolean>(false);

  useEffect(() => {
    let unlistenJs = listen<string>("connection-status", (_) => {
      console.log("connection-status");
      setBackendAvaiable(true);
    })

    invoke<string>("get_connection_status").then((_) => {
      console.log("get connection status");
      setBackendAvaiable(true);
    }).catch(() => {}); 
    return () => {
      unlistenJs.then(f => f()).catch(console.error);
    };
  }, []);

  const theme = useTheme();
  return (
    <Box id="content" component="form" sx={{ display: 'flex' }}>
      <CssBaseline />
      <CustomAppBar
        stateColor="stateIdle"
        open={open}
        toggleOpen={() => setOpen(x => !x)} />
      <SideMenu open={open} toggleOpen={() => setOpen(x => !x)} />
      <Box
        component="main"
        sx={{
          backgroundColor: theme.palette.background.main,
          flexGrow: 1,
          minHeight: 'calc(100vh - 75px)',
          maxHeight: 'calc(100vh - 75px)',
          overflow: 'auto',
          position: "relative",
          marginTop: "75px",
        }}
      >
        <Box component="form" sx={{ width: '100%' }}>
          <ShowPages connectionSuccess={backendAvaiable} />
        </Box>
      </Box>
    </Box>
  );
}

export default Content;
