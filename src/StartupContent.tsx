import { AppBar, Box, Container, CssBaseline, Toolbar, Typography, useTheme } from "@mui/material";
import StartupStepper from "./StartupStepper";

function StartupContent() {
  const theme = useTheme();

  return (
    <Box id="content" component="div" display="flex">
      <CssBaseline />
      <AppBar position="absolute" sx={{
        backgroundColor: theme.palette.background.appBar,
        height: "60px",
      }}>
        <Container component="div">
          <Toolbar disableGutters>
            <Typography variant="h5" color={theme.palette.text.secondary}>
              CANzero
            </Typography>
            <Typography marginLeft="0.5em" variant="h5" color={theme.palette.text.disabled}>
              Startup
            </Typography>
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
        <StartupStepper/>
      </Container>
    </Box>
  );
}

export default StartupContent;
