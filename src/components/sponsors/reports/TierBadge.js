import React from "react";
import { Chip } from "@mui/material";

// Tier colors aren't in the MUI palette, so map the known tiers to explicit
// sx colors; an unknown-but-present tier renders as a neutral outlined chip.
const TIER_SX = {
  gold: { bgcolor: "#F6C944", color: "#5A4500" },
  silver: { bgcolor: "#C9CDD3", color: "#33373D" },
  bronze: { bgcolor: "#CD7F4B", color: "#3A1E0A" }
};

// `onDark` makes the neutral (unknown-tier) outlined chip legible on a dark
// surface (the drill-down navy header) — default dark text on navy is
// unreadable. Known tiers use explicit fills that read on any background, so
// onDark only affects the neutral case.
const TierBadge = ({ tier, onDark = false }) => {
  if (!tier) return null;
  const key = String(tier).toLowerCase();
  const sx = TIER_SX[key];
  if (sx) {
    return (
      <Chip
        size="small"
        label={String(tier).toUpperCase()}
        variant="filled"
        sx={{ ...sx, fontWeight: 600 }}
      />
    );
  }
  return (
    <Chip
      size="small"
      label={String(tier).toUpperCase()}
      variant="outlined"
      sx={{
        fontWeight: 600,
        ...(onDark
          ? { color: "common.white", borderColor: "rgba(255,255,255,0.7)" }
          : {})
      }}
    />
  );
};

export default TierBadge;
