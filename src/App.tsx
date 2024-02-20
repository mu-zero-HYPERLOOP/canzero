import { StaticRouter } from "react-router-dom/server";
import "./App.css";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider} from "@mui/material";
import { SnackbarProvider } from "notistack";
import NotificationSystem from "./dashboard/NotificationSystem.tsx";
import React from "react";
import Content from "./Content.tsx";
import theme from "./theme.ts"

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

// Augment the palette to include an ochre color
declare module '@mui/material/styles' {
  interface Palette {
    ochre: Palette['primary'];
  }

  interface PaletteOptions {
    backgroundAndIcons?: PaletteOptions['primary'];
  }
}



function App() {

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider preventDuplicate maxSnack={7}>
        <NotificationSystem />
        <Router>
          <Content/>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
