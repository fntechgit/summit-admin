import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import T from "i18n-react/dist/i18n-react";

// Exclusive toggle between the order-grain "Orders" view and the per-line
// "Line Items" (manifest) view. MUI passes null when the active button is
// re-clicked in exclusive mode; ignore it so a view is always selected.
const ReportViewToggle = ({ value, onChange }) => (
  <ToggleButtonGroup
    exclusive
    size="medium"
    value={value}
    onChange={(_e, next) => {
      if (next) onChange(next);
    }}
    aria-label={T.translate("sponsor_reports_page.view_toggle")}
    // Match the adjacent action buttons (Print / Export CSV) typography.
    // Use px, not rem: this app sets html root font-size to 62.5% (10px), so a
    // hardcoded "0.875rem" would render 8.75px. The MuiButton resolves to 14px.
    sx={{ "& .MuiToggleButton-root": { fontSize: "14px", fontWeight: 500 } }}
  >
    <ToggleButton value="orders">
      {T.translate("sponsor_reports_page.view_orders")}
    </ToggleButton>
    <ToggleButton value="lines">
      {T.translate("sponsor_reports_page.view_line_items")}
    </ToggleButton>
  </ToggleButtonGroup>
);

export default ReportViewToggle;
