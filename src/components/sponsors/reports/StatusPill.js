import React from "react";
import { Chip } from "@mui/material";

// Single source of truth: status token -> MUI Chip color. Case-insensitive.
const TONE_BY_STATUS = {
  completed: "success",
  paid: "success",
  confirmed: "success",
  pending: "warning",
  in_progress: "info",
  not_applicable: "default",
  canceled: "default",
  cancelled: "default"
};

export const statusTone = (status) =>
  TONE_BY_STATUS[String(status || "").toLowerCase()] || "default";

// A status token rendered as a colored, filled chip. `label` overrides the
// displayed text (e.g. a T.translate'd label); the color always derives from
// the raw `status` token via the shared tone map.
const StatusPill = ({ status, label, size = "small" }) => (
  <Chip
    size={size}
    color={statusTone(status)}
    variant="filled"
    label={label != null ? label : status}
  />
);

export default StatusPill;
