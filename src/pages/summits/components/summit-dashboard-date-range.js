import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import RemoveIcon from "@mui/icons-material/Remove";
import { formatDate } from "../../../utils/methods";
import { DATETIME_FORMAT } from "../../../utils/constants";

function SummitDashboardDateRange({ label, startTs, endTs, tzName }) {
  if (!startTs || !endTs) return null;

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
      <Typography variant="body1">
        {formatDate(startTs, tzName, DATETIME_FORMAT)}
      </Typography>
      <RemoveIcon sx={{ mx: 2, fontSize: 16 }} />
      <Typography variant="body1">
        {formatDate(endTs, tzName, DATETIME_FORMAT)}
      </Typography>
    </Box>
  );
}

SummitDashboardDateRange.propTypes = {
  label: PropTypes.string.isRequired,
  startTs: PropTypes.number,
  endTs: PropTypes.number,
  tzName: PropTypes.string
};

SummitDashboardDateRange.defaultProps = {
  startTs: null,
  endTs: null,
  tzName: undefined
};

export default SummitDashboardDateRange;
