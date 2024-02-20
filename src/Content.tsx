import CustomAppBar from "./app_bar/CustomAppBar";
import { useState } from "react";
import SideMenu from "./side_menu/SideMenu";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Toolbar, useTheme } from "@mui/material";
import ShowPages from "./dashboard/ShowPages";




function Content() {
  const [open, setOpen] = useState<boolean>(false);
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
          <ShowPages connectionSuccess={false} />
        </Box>
      </Box>
    </Box>
  );
}

export default Content;
