import React from "react";
import { Chip, Stack } from "@mui/material";
import T from "i18n-react/dist/i18n-react";
import { statusTone } from "./StatusPill";

// The backend status_rollup always carries all four lowercase keys; render them
// in a fixed order so cards line up. A missing rollup degrades to all-zero.
const STATUS_KEYS = ["completed", "in_progress", "pending", "not_applicable"];

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
