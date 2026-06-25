import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

// tone -> theme color for the value text. "neutral"/undefined keeps default.
const TONE_COLOR = {
  success: "success.main",
  warning: "warning.main",
  info: "info.main"
};

const SummaryPanel = ({ tiles = [] }) => {
  if (!tiles.length) return null;
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
      {tiles.map((tile) => (
        <Paper
          key={tile.key}
          variant="outlined"
          sx={{ p: 2, flex: 1, minWidth: 140, borderRadius: 2 }}
        >
          <Typography
            variant="subtitle1"
            color="text.secondary"
            // subtitle1 resolves to ~10px in this theme; pin a readable px.
            sx={{ fontWeight: 500, fontSize: "14px" }}
          >
            {tile.label}
          </Typography>
          <Box>
            <Typography
              variant="h5"
              sx={{ color: TONE_COLOR[tile.tone], fontWeight: 600 }}
            >
              {tile.value}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
};

export default SummaryPanel;
