import React from "react";
import T from "i18n-react/dist/i18n-react";
import ChipList from "../../mui/chip-list";
import { STATUS_KEYS } from "./build-pivot-tree";

// Render the displayed status keys in a fixed order so cards line up. A missing
// rollup degrades to all-zero.

const StatusRollupChips = ({ rollup }) => {
  const r = rollup || {};
  const chips = STATUS_KEYS.map(
    (key) =>
      `${T.translate(`sponsor_reports_page.status_${key}`)}: ${r[key] || 0}`
  );
  // maxLength = number of displayed statuses so the "..." overflow never triggers;
  // every rollup chip must always be shown.
  return <ChipList chips={chips} maxLength={STATUS_KEYS.length} />;
};

export default StatusRollupChips;
