import React from "react";
import { Typography } from "@mui/material";
import { InlineCard } from "openstack-uicore-foundation/lib/components/mui/cards";

// tone -> theme color for the value text. "neutral"/undefined keeps default.
const TONE_COLOR = {
  success: "success.main",
  warning: "warning.main",
  info: "info.main"
};

const SummaryPanel = ({ tiles = [] }) => {
  if (!tiles.length) return null;
  const rows = tiles.map((tile) => ({
    label: tile.label,
    value: (
      <Typography
        variant="h5"
        sx={{ color: TONE_COLOR[tile.tone], fontWeight: 600 }}
      >
        {tile.value}
      </Typography>
    )
  }));
  return <InlineCard rows={rows} />;
};

export default SummaryPanel;
