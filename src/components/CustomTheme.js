import React from "react";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import PropTypes from "prop-types";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2196F3",
      dark: "#1E88E5",
      contrast: "#FFFFFF"
    },
    background: {
      light: "#F7F7F9"
    },
    text: {
      primary: "#000000DE",
      secondary: "#00000099",
      link: "#2196f3",
      disabled: "#00000061"
    }
  },
  typography: {
    fontFamily: ["Roboto", "sans-serif"].join(","),
    body1: {
      fontSize: "14px",
      fontWeight: 400
    },
    body2: {
      fontSize: "14px",
      fontWeight: 500
    },
    caption: {
      fontSize: "12px",
      fontWeight: 400
    },
    subtitle2: ({ theme }) => ({
      fontSize: "14px",
      fontWeight: 500,
      color: theme.palette.text.primary
    }),
    h4: {
      fontSize: "34px",
      fontWeight: 500,
      lineHeight: "42px",
      letterSpacing: "0.25px"
    },
    h5: {
      fontSize: "24px",
      fontWeight: 400,
      "&.MuiTypography-gutterBottom": {
        marginBottom: "20px"
      }
    },
    h6: {
      fontSize: "20px",
      fontWeight: 500,
      lineHeight: "32px",
      letterSpacing: "0.15px",
      "&.MuiTypography-gutterBottom": {
        marginBottom: "20px"
      }
    }
  },
  components: {
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: ".8em",
          position: "absolute",
          top: "100%",
          marginTop: "4px"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          fontWeight: 500,
          ...(ownerState.size === "small" && {
            fontSize: "13px",
            lineHeight: "18px",
            padding: "9px 16px"
          }),
          ...(ownerState.size === "medium" && {
            fontSize: "14px",
            lineHeight: "20px",
            padding: "10px 20px"
          }),
          ...(ownerState.size === "large" && {
            fontSize: "16px",
            lineHeight: "22px",
            padding: "12px 24px"
          })
        })
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: "14px",
          lineHeight: "18px",
          color: "#00000099",
          "&.Mui-selected": {
            color: "#2196f3"
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: "#2196f3"
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: "12px"
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: "12px"
        },
        standardInfo: ({ theme }) => ({
          color: theme.palette.primary.dark
        })
      }
    }
  }
});

const CustomTheme = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

CustomTheme.propTypes = {
  children: PropTypes.node.isRequired
};

export default CustomTheme;
