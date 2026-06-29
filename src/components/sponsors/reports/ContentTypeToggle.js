import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import T from "i18n-react/dist/i18n-react";

// MUI ToggleButtonGroup passes `null` when the active button is re-clicked
// (exclusive mode); ignore it so the view never ends up with no content type.
const ContentTypeToggle = ({ value, onChange }) => (
  <ToggleButtonGroup
    exclusive
    size="medium"
    value={value}
    onChange={(_e, next) => {
      if (next) onChange(next);
    }}
    aria-label={T.translate("sponsor_reports_page.content_type")}
    // Match the adjacent action buttons (Print / Export CSV) typography.
    // px, not rem: html root font-size is 62.5% (10px) here, so "0.875rem" would
    // render 8.75px; the MuiButton resolves to 14px.
    sx={{
      "& .MuiToggleButton-root": { px: 2.5, fontSize: "14px", fontWeight: 500 }
    }}
  >
    <ToggleButton value="collected">
      {T.translate("sponsor_reports_page.content_collected")}
    </ToggleButton>
    <ToggleButton value="all">
      {T.translate("sponsor_reports_page.content_all")}
    </ToggleButton>
  </ToggleButtonGroup>
);

export default ContentTypeToggle;
