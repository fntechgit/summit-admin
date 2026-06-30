import React from "react";
import { Chip, Stack } from "@mui/material";
import T from "i18n-react/dist/i18n-react";
import { statusTone } from "./StatusPill";

// Render the displayed status keys in a fixed order so cards line up. A missing
// rollup degrades to all-zero. not_applicable is intentionally omitted — the report
// is scoped to Media assets, which never produce that status.
const STATUS_KEYS = ["completed", "in_progress", "pending"];

const StatusRollupChips = ({ rollup }) => {
  const r = rollup || {};
  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      {STATUS_KEYS.map((key) => (
        <Chip
          key={key}
          size="small"
          color={statusTone(key)}
          variant="outlined"
          label={`${T.translate(`sponsor_reports_page.status_${key}`)}: ${
            r[key] || 0
          }`}
        />
      ))}
    </Stack>
  );
};

export default StatusRollupChips;
