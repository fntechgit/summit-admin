import React from "react";
import { Chip } from "@mui/material";
import { statusTone } from "./statusTone";

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

export { statusTone };
export default StatusPill;
