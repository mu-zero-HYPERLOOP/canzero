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
    stateIdle: Palette["primary"],
    stateArming45: Palette["primary"],
    statePrecharge: Palette["primary"],
    stateDisarming45: Palette["primary"],
    stateReady: Palette["primary"],
    stateStartLevitation: Palette["primary"],
    stateLevitation: Palette["primary"],
    stateStartGuidance: Palette["primary"],
    stateGuidance: Palette["primary"],
    stateAccelerate: Palette["primary"],
    stateController: Palette["primary"],
    stateCruising: Palette["primary"],
    stateDeceleration: Palette["primary"],

    stateStopLevitation: Palette["primary"],
    stateStopGuidance: Palette["primary"],

    stateShutdown: Palette["primary"],
    stateRestarting: Palette["primary"],
    stateCalibrating: Palette["primary"],

    subStateArm: Palette["primary"],
    subStatePrecharge: Palette["primary"],
    subStateDisarm: Palette["primary"],
    subStateReady: Palette["primary"],
    subStateStart: Palette["primary"],
    subStateStop: Palette["primary"],
    subStateControl: Palette["primary"],
    subStateOther: Palette["primary"],

    disconnected: Palette["primary"],

    temperatureHot: Palette["primary"],
    temperatureOk: Palette["primary"],
  }
  interface PaletteOptions {
    stateInit?: PaletteOptions["primary"],
    stateIdle?: PaletteOptions["primary"],
    stateArming45?: PaletteOptions["primary"],
    statePrecharge?: PaletteOptions["primary"],
    stateDisarming45?: PaletteOptions["primary"],
    stateReady?: PaletteOptions["primary"],
    stateStartLevitation?: PaletteOptions["primary"],
    stateLevitation?: PaletteOptions["primary"],
    stateStartGuidance?: PaletteOptions["primary"],
    stateGuidance?: PaletteOptions["primary"],
    stateAccelerate?: PaletteOptions["primary"],
    stateController?: PaletteOptions["primary"],
    stateCruising?: PaletteOptions["primary"],
    stateDeceleration?: PaletteOptions["primary"],

    stateStopLevitation?: PaletteOptions["primary"],
    stateStopGuidance?: PaletteOptions["primary"],

    stateShutdown?: PaletteOptions["primary"],
    stateRestarting?: PaletteOptions["primary"],
    stateCalibrating?: PaletteOptions["primary"],

    subStateArm?: PaletteOptions["primary"],
    subStatePrecharge?: PaletteOptions["primary"],
    subStateDisarm?: PaletteOptions["primary"],
    subStateReady?: PaletteOptions["primary"],
    subStateStart?: PaletteOptions["primary"],
    subStateStop?: PaletteOptions["primary"],
    subStateControl?: PaletteOptions["primary"],
    subStateOther?: PaletteOptions["primary"],

    disconnected?: PaletteOptions["primary"],

    temperatureHot?: PaletteOptions["primary"],
    temperatureOk?: PaletteOptions["primary"],
  }
  interface TypeBackground {
    drawer?: string,
    appBar?: string,
    trace?: string,
    main?: string,
    paper2?: string,
    warn?: string,
    error?: string,
    disabled?: string
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    stateInit: true,
    stateIdle: true,
    stateArming45: true,
    statePrecharge: true,
    stateDisarming45: true,
    stateReady: true,
    stateStartLevitation: true,
    stateLevitation: true,
    stateStartGuidance: true,
    stateGuidance: true,
    stateAccelerate: true,
    stateController: true,
    stateCruising: true,
    stateDeceleration: true,

    stateStopLevitation: true,
    stateStopGuidance: true,

    stateShutdown: true,
    stateRestarting: true,
    stateCalibrating: true,

    subStateArm: true,
    subStatePrecharge: true,
    subStateDisarm: true,
    subStateReady: true,
    subStateStart: true,
    subStateStop: true,
    subStateControl: true,
    subStateOther: true,

    disconnected: true,
  }
}

declare module "@mui/material/AppBar" {
  interface AppBarPropsColorOverrides {
    background: true,
    front: true,
  }
}

const theme = responsiveFontSizes(createTheme({
  palette: {
    background: {
      appBar: "#232323",
      trace: "#e7e7e7",
      drawer: "#ffffff",
      default: "#f7f7f7",
      main: "#f3f3f3",
      paper: "#ededed",
      paper2: "#f3f3f3",
      warn: "#f2e9ce",
      error: "#f2d5d5",
      disabled: "#a2a2a2"
    },


    stateInit: {
      main: "#807e7e",
    },
    stateIdle: {
      main: "#4d4d4d",
    },
    stateArming45: {
      main: "#ffff00",
    },
    statePrecharge: {
      main: "#b3ff00",
    },
    stateDisarming45: {
      main: "#ff9100",
    },
    stateReady: {
      main: "#3cff00",
    },
    stateStartLevitation: {
      main: "#00ff91",
    },
    stateLevitation: {
      main: "#00ffe1",
    },
    stateStartGuidance: {
      main: "#00bbff",
    },
    stateGuidance: {
      main: "#0055ff",
    },
    stateAccelerate: {
      main: "#7300ff"
    },
    stateController: {
      main: "#2b00ff",
    },
    stateCruising: {
      main: "#c800ff",
    },
    stateDeceleration: {
      main: "#7300ff"
    },
    stateStopLevitation: {
      main: "#00ff91",
    },
    stateStopGuidance: {
      main: "#00bbff",
    },
    stateShutdown: {
      main: "#4d4d4d",
    },
    stateRestarting: {
      main: "#ff0aeb",
    },
    stateCalibrating: {
      main: "#ff0aeb",
    },
    subStateArm: {
      main: "#ffff00",
    },
    subStatePrecharge: {
      main: "#b3ff00",
    },
    subStateDisarm: {
      main: "#ff9100",
    },
    subStateReady: {
      main: "#3cff00",
    },
    subStateStart: {
      main: "#00bbff",
    },
    subStateStop: {
      main: "#00ff91",
    },
    subStateControl: {
      main: "#2b00ff",
    },
    subStateOther: {
      main: "#ff0aeb",
    },

    disconnected: {
      main: "#ff0a0a",
    },

    temperatureHot: {
      main: "#ff0a0a",
    },
    temperatureOk: {
      main: "#2b00ff",
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
}));

export default theme;
