import { createTheme, alpha } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#231239",        
      light: "#3A1D5A",
      dark: "#150A23",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#BCBDBE",
      light: "#D4D5D6",
      dark: "#6A7071",
      contrastText: "#141414",
    },
    background: {
      default: "#141414",
      paper: "#1E1E1E",
    },
    text: {
      primary: "#F5F5F5",
      secondary: alpha("#BCBDBE", 0.85),
      disabled: alpha("#BCBDBE", 0.5),
    },
    error:   { main: "#FF5252" },
    warning: { main: "#FFC107" },
    info:    { main: "#64B5F6" },
    success: { main: "#58AD95" },
    divider: alpha("#BCBDBE", 0.2),
  },

  shape: { borderRadius: 12 },

  typography: {
    fontFamily: ["Poppins", "Helvetica Neue", "Arial", "sans-serif"].join(","),
    h1: { fontWeight: 700, color: "#F5F5F5" },
    h2: { fontWeight: 700, color: "#F5F5F5" },
    h3: { fontWeight: 600, color: "#F5F5F5" },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0.2, color: "#F5F5F5" },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#141414",
          color: "#F5F5F5",
        },
        "::selection": { backgroundColor: alpha("#E6007A", 0.35) },
      },
    },

    // Navbar roze
    MuiAppBar: {
      defaultProps: { color: "primary" },
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#E6007A",
          color: "#FFFFFF",
          boxShadow: "none",
          borderBottom: `1px solid ${alpha("#FFFFFF", 0.15)}`,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1E1E1E",
          color: "#F5F5F5",
        },
      },
      defaultProps: { elevation: 0 },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          ":focus-visible": {
            outline: `2px solid ${alpha("#E6007A", 0.7)}`,
            outlineOffset: 2,
          },
        },
        containedPrimary: {
          backgroundColor: "#231239",
          color: "#FFFFFF",
          "&:hover": { backgroundColor: "#3A1D5A" },
        },
        containedSecondary: {
          backgroundColor: "#6A7071",
          color: "#141414",
          "&:hover": { backgroundColor: "#5A5F60" },
        },
        outlinedPrimary: {
          borderColor: alpha("#231239", 0.6),
          color: "#FFFFFF",
          "&:hover": {
            borderColor: "#231239",
            backgroundColor: alpha("#231239", 0.08),
          },
        },
        textPrimary: {
          color: "#FFFFFF",
          "&:hover": { backgroundColor: alpha("#231239", 0.08) },
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          color: "#FF4AA6",
          "&:hover": { color: "#E6007A" },
          ":focus-visible": {
            outline: `2px solid ${alpha("#E6007A", 0.6)}`,
            outlineOffset: 2,
          },
        },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: alpha("#BCBDBE", 0.2) } },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: alpha("#BCBDBE", 0.25) },
            "&:hover fieldset": { borderColor: alpha("#E6007A", 0.7) },
            "&.Mui-focused fieldset": { borderColor: "#E6007A" },
          },
        },
      },
    },
  },
});

export default theme;
