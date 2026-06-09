import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function SummitDashboardSectionHeader({ children }) {
  return (
    <Box sx={{ bgcolor: "background.secondary", px: 2, py: 2 }}>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

SummitDashboardSectionHeader.propTypes = {
  children: PropTypes.node.isRequired
};

export default SummitDashboardSectionHeader;
