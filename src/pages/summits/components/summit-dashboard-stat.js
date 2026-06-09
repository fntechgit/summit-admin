import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function SummitDashboardStat({ label, value }) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h3">{value}</Typography>
    </Box>
  );
}

SummitDashboardStat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number
};

SummitDashboardStat.defaultProps = {
  value: 0
};

export default SummitDashboardStat;
