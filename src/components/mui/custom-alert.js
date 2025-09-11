import React from "react";
import { Alert } from "@mui/material";

const CustomAlert = ({ severity = "info", message = "", hideIcon = false }) => (
  <Alert
    severity={severity}
    icon={!hideIcon}
    sx={{
      justifyContent: "start",
      alignItems: "center",
      mb: 2
    }}
  >
    {message}
  </Alert>
);

export default CustomAlert;
