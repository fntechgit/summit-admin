import React from "react";
import { Chip } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";

const ChipNotify = ({ label, color = "warning", Icon = NotificationsIcon, ...props }) => (
  <Chip
    icon={<Icon />}
    color={color}
    label={label.toUpperCase()}
    variant="outlined"
    {...props}
  />
);

export default ChipNotify;
