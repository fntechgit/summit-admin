import React from "react";
import PropTypes from "prop-types";
import { Tooltip } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

const InfoTooltip = ({ title }) => (
  <Tooltip
    title={title}
    placement="top"
    slotProps={{ tooltip: { sx: { fontSize: "0.625rem" } } }}
  >
    <InfoIcon fontSize="small" sx={{ ml: 0.5, verticalAlign: "middle" }} />
  </Tooltip>
);

InfoTooltip.propTypes = {
  title: PropTypes.string.isRequired
};

export default InfoTooltip;
