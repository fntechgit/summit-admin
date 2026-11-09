import React from "react";
import PropTypes from "prop-types";
import T from "i18n-react/dist/i18n-react";
import { Box, Drawer, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const PANEL_WIDTH = 360;

const TaskPanel = ({ open, onClose, children }) => (
  <Drawer
    anchor="right"
    variant="persistent"
    open={open}
    sx={{
      "& .MuiDrawer-paper": { width: PANEL_WIDTH, boxSizing: "border-box" }
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.5,
        borderBottom: 1,
        borderColor: "divider"
      }}
    >
      <Typography variant="h6" component="h2">
        {T.translate("task_panel.my_tasks")}
      </Typography>
      <IconButton
        onClick={onClose}
        aria-label={T.translate("task_panel.close")}
      >
        <CloseIcon />
      </IconButton>
    </Box>
    {children}
  </Drawer>
);

TaskPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node
};

TaskPanel.defaultProps = {
  children: null
};

export default TaskPanel;
