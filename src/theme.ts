import {
  createTheme,
  responsiveFontSizes,
} from "@mui/material/styles";

    
declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    mobile: true;
    tablet: true;
    laptop: true;
    desktop: true;
  }
  interface Palette {
    stateInit: Palette["primary"],
    stateIdle: Palette["primary"];
    statePrecharge: Palette["primary"],
    stateReady : Palette["primary"],
    stateStart: Palette["primary"],
    stateLevitation: Palette["primary"],
    stateRunning: Palette["primary"],
    stateStop: Palette["primary"],
    stateError: Palette["error"],
    stateManual : Palette["primary"],
    disconnected : Palette["primary"],
    temperatureHot : Palette["primary"],
    temperatureOk : Palette["primary"],
  }
  interface PaletteOptions {
    stateInit?: PaletteOptions["primary"],
    stateIdle?: PaletteOptions["primary"],
    statePrecharge?: PaletteOptions["primary"],
    stateReady?: PaletteOptions["primary"],
    stateStart?: PaletteOptions["primary"],
    stateLevitation?: PaletteOptions["primary"],
    stateRunning?: PaletteOptions["primary"],
    stateStop?: PaletteOptions["primary"],
    stateError?: PaletteOptions["error"],
    stateManual?: PaletteOptions["primary"],
    disconnected?: PaletteOptions["primary"],
    temperatureHot? : PaletteOptions["primary"],
    temperatureOk? : PaletteOptions["primary"],
  }
  interface TypeBackground {
    drawer?: string,
    appBar?: string,
    trace?: string,
    main? : string,
    paper2?: string,
    warn?: string,
    error?: string,
    disabled?: string
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    stateInit: true,
    stateIdle : true;
    statePrecharge: true,
    stateReady: true;
    stateStart: true,
    stateStop : true,
    stateLevitation: true,
    stateRunning: true,
    stateError: true,
    stateManual: true,
    disconnected: true,
  }
}

declare module "@mui/material/AppBar" {
  interface AppBarPropsColorOverrides {
    background: true,
    front: true,
  }
}

let theme = createTheme({
  palette: {
    // primary: {
    //   light: "#6E5B54",
    //   main: "#60504a",
    //   dark: "#614941",
    // },
    // secondary: {
    //   light: "#f7f7f7",
    //   main: "#e7e7e7",
    //   dark: "#787878",
    // },
    background : {
      appBar: "#1F1F1F",
      trace: "#e7e7e7",
      drawer: "#ffffff",
      default: "#f7f7f7",
      main: "#f7f7f7",
      paper: "#ededed",
      paper2: "#f5f5f5",
      warn: "#f2e9ce",
      error: "#f2d5d5",
      disabled: "#808080"
    },
    stateInit: {
      main: "#e0d845",
      light: "#e0da69",
      dark: "#ccc200",
      contrastText: "#000000",
    },
    stateIdle: {
      main: "#356dd7",
      light: "#5481d7",
      dark: "#144eba",
      contrastText: "#ffffff",
    },
    statePrecharge: {
      main : "#49c8de",
      light: "#7fd0de",
      dark: "#2ea3b8",
      contrastText: "#ffffff",
    },
    stateReady: {
      main : "#43cb5e",
      light: "#7acb8a",
      dark: "#35aa4c",
      contrastText: "#ffffff",
    },
    stateStart: {
      main: "#e0d845",
      light: "#e0da69",
      dark: "#ccc200",
    },
    stateLevitation: {
      main: "#f1ab2f",
      light: "#f1bc5e",
      dark: "#d89216",
    },
    stateRunning: {
      main: "#b361e6",
      light: "#c288e6",
      dark: "#9d3fd8",
    },
    stateStop: {
      main: "#e0d845",
      light: "#e0da69",
      dark: "#ccc200",
    },
    stateError: {
      main: "#d83c35",
      light: "#d85650",
      dark: "#c91e16",
      contrastText : "#FFFFFF",
    },
    stateManual: {
      main: "#df4ec7",
      light: "#df6dcc",
      dark: "#c92ba6",
    },
    text: {
      primary: "#5F5049",
    },
    temperatureHot : {
    },
    temperatureOk : {
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      mobile: 0,
      tablet: 640,
      laptop: 1200,
      desktop: 1600,
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
