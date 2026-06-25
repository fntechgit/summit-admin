import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import T from "i18n-react/dist/i18n-react";

// MUI ToggleButtonGroup passes `null` when the active button is re-clicked
// (exclusive mode); ignore it so the view never ends up with no grouping.
const GroupByToggle = ({ value, onChange }) => (
  <ToggleButtonGroup
    exclusive
    size="medium"
    value={value}
    onChange={(_e, next) => {
      if (next) onChange(next);
    }}
    aria-label={T.translate("sponsor_reports_page.group_by")}
    // Match the adjacent action buttons (Print / Export CSV) typography.
    // px, not rem: html root font-size is 62.5% (10px) here, so "0.875rem" would
    // render 8.75px; the MuiButton resolves to 14px.
    sx={{
      "& .MuiToggleButton-root": { px: 2.5, fontSize: "14px", fontWeight: 500 }
    }}
  >
    <ToggleButton value="sponsor">
      {T.translate("sponsor_reports_page.group_by_sponsor")}
    </ToggleButton>
    <ToggleButton value="component">
      {T.translate("sponsor_reports_page.group_by_component")}
    </ToggleButton>
  </ToggleButtonGroup>
);

export default GroupByToggle;
