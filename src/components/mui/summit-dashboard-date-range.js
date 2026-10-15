import React from "react";
import PropTypes from "prop-types";
import Typography from "@mui/material/Typography";
import RemoveIcon from "@mui/icons-material/Remove";
import DashboardRow from "./dashboard-row";
import { formatDate } from "../../utils/methods";
import { DATETIME_FORMAT } from "../../utils/constants";

function SummitDashboardDateRange({
  label,
  startTs,
  endTs,
  tzName,
  labelWidth
}) {
  if (!startTs || !endTs) return null;

  return (
    <DashboardRow label={label} labelWidth={labelWidth}>
      <Typography variant="body1">
        {formatDate(startTs, tzName, DATETIME_FORMAT)}
      </Typography>
      <RemoveIcon sx={{ mx: 2, fontSize: 16 }} />
      <Typography variant="body1">
        {formatDate(endTs, tzName, DATETIME_FORMAT)}
      </Typography>
    </DashboardRow>
  );
}

SummitDashboardDateRange.propTypes = {
  label: PropTypes.string.isRequired,
  startTs: PropTypes.number,
  endTs: PropTypes.number,
  tzName: PropTypes.string,
  labelWidth: PropTypes.number
};

SummitDashboardDateRange.defaultProps = {
  startTs: null,
  endTs: null,
  tzName: undefined,
  labelWidth: undefined
};

export default SummitDashboardDateRange;
