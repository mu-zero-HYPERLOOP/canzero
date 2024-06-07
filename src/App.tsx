import { StaticRouter } from "react-router-dom/server";
import "./App.css";
import { MemoryRouter } from "react-router-dom";
import {ThemeProvider} from "@mui/material";
import { SnackbarProvider } from "notistack";
import NotificationSystem from "./dashboard/NotificationSystem.tsx";
import React, { useEffect } from "react";
import Content from "./Content.tsx";
import theme from "./theme.ts"
import {invoke} from "@tauri-apps/api";
import {Heartbeat} from "./heartbeat/Heartbeat.tsx";
import {appWindow} from "@tauri-apps/api/window";
import {ask} from "@tauri-apps/api/dialog";

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

function App() {
  useEffect(() => {
    invoke("close_startup", {}).catch(console.error);
  }, []);

  useEffect(() => {
    async function close() {
      const unlisten = await appWindow.onCloseRequested(async () => {
        const saveLogs = await ask("Save logs before closing?");
        if (saveLogs) {
          await invoke("export")
        }
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

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider preventDuplicate maxSnack={7}>
        <Heartbeat/>
        <NotificationSystem />
        <Router>
          <Content/>
        </Router>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
