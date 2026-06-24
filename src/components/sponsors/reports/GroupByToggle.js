import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import T from "i18n-react/dist/i18n-react";

// MUI ToggleButtonGroup passes `null` when the active button is re-clicked
// (exclusive mode); ignore it so the view never ends up with no grouping.
const GroupByToggle = ({ value, onChange }) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={value}
    onChange={(_e, next) => {
      if (next) onChange(next);
    }}
    aria-label={T.translate("sponsor_reports_page.group_by")}
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
