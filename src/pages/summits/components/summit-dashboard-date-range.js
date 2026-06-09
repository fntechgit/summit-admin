import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RemoveIcon from "@mui/icons-material/Remove";
import moment from "moment-timezone";

function formatDate(ts, tzName) {
  return moment.unix(ts).tz(tzName).format("YYYY/MM/DD  hh:mm A");
}

function SummitDashboardDateRange({ label, startTs, endTs, tzName }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        height: 75,
        px: 2,
        borderBottom: 1,
        borderColor: "divider"
      }}
    >
      <Box sx={{ minWidth: 120 }}>
        <Typography variant="body2">{label}</Typography>
      </Box>
      <Typography variant="body1">{formatDate(startTs, tzName)}</Typography>
      <RemoveIcon sx={{ mx: 2, fontSize: 16 }} />
      <Typography variant="body1">{formatDate(endTs, tzName)}</Typography>
    </Box>
  );
}

SummitDashboardDateRange.propTypes = {
  label: PropTypes.string.isRequired,
  startTs: PropTypes.number.isRequired,
  endTs: PropTypes.number.isRequired,
  tzName: PropTypes.string.isRequired
};

export default SummitDashboardDateRange;
