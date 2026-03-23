import React from "react";
import { Typography } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import T from "i18n-react/dist/i18n-react";

const UnderlyingAlertNote = ({ showAdditionalItems }) => {
  if (!showAdditionalItems) return null;

  return (
    <Typography
      variant="body2"
      component="p"
      sx={{ color: "error.warning", fontSize: "0.8rem" }}
    >
      <ErrorIcon
        color="error"
        sx={{
          fontSize: "1rem",
          top: "0.2rem",
          position: "relative"
        }}
      />{" "}
      {T.translate("edit_form.additional_info")}
    </Typography>
  );
};

export default UnderlyingAlertNote;
