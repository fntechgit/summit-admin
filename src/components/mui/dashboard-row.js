import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function DashboardRow({ label, labelWidth, children }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        minHeight: 75,
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: "divider"
      }}
    >
      <Box sx={{ minWidth: labelWidth, flexShrink: 0, pr: 2 }}>
        <Typography variant="body2">{label}</Typography>
      </Box>
      {children}
    </Box>
  );
}

DashboardRow.propTypes = {
  label: PropTypes.string.isRequired,
  labelWidth: PropTypes.number,
  children: PropTypes.node.isRequired
};

DashboardRow.defaultProps = {
  labelWidth: 120
};

export default DashboardRow;
