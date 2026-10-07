import React from "react";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { MuiBaseCustomTheme } from "openstack-uicore-foundation/lib/utils/theme";
import PropTypes from "prop-types";

const theme = createTheme(MuiBaseCustomTheme, {
  palette: {
    primary: {
      main: "#2196F3",
      dark: "#1E88E5",
      contrast: "#FFFFFF"
    },
    background: {
      light: "#F7F7F9",
      light_gray: "#eaeaea"
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
      fontSize: "14px"
    },
    body2: {
      fontWeight: 500
    },
    subtitle2: ({ theme: t }) => ({
      color: t.palette.text.primary
    }),
    h4: {
      fontWeight: 500
    },
    h5: {
      "&.MuiTypography-gutterBottom": {
        marginBottom: "20px"
      }
    },
    h6: {
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
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
          "&:active": { boxShadow: "none" },
          "&:focus": { boxShadow: "none" },
          ...(ownerState.size === "small" && {
            lineHeight: "18px",
            padding: "9px 16px"
          }),
          ...(ownerState.size === "medium" && {
            lineHeight: "20px",
            padding: "8px 12px",
            height: "36px"
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
        message: {
          fontWeight: "normal"
        },
        standardInfo: ({ theme }) => ({
          color: theme.palette.primary.dark,
          "& .MuiAlert-message": {
            color: theme.palette.primary.dark
          }
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
