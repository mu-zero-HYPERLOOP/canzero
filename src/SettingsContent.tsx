import { AppBar, Box, Container, CssBaseline, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Stack, Toolbar, Typography, useTheme } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import { invoke } from "@tauri-apps/api";


function SettingsContent() {
  const theme = useTheme();

  return (
    <Box id="content" component="div" display="flex">
      <CssBaseline />
      <AppBar position="absolute" sx={{
        backgroundColor: theme.palette.background.appBar,
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
                Settings
              </Typography>
            </Stack>
            <Stack component="div" direction="row" spacing={2}>
              <IconButton onClick={() => invoke("close_settings").catch(console.error)}>
                <CloseIcon />
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
        width: "100%",
        overflow: 'auto',
        position: "relative",
        marginTop: "60px",
      }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={()=>{
              invoke("select_network_configuration").catch(console.error);
            }}>
              <ListItemIcon>
                <SettingsApplicationsIcon />
              </ListItemIcon>
              <ListItemText primary="Select network configuration" />
            </ListItemButton>
          </ListItem>
        </List>
      </Container>

    </Box >
  );
}

export default SettingsContent;
