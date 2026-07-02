import React from "react";
import { Box } from "@mui/material";
import T from "i18n-react/dist/i18n-react";
import MuiDropdown from "openstack-uicore-foundation/lib/components/mui/dropdown";
import { PIVOTS } from "./pivot-defs";

const PivotSelector = ({ value, onChange }) => (
  <Box sx={{ width: 280 }}>
    <MuiDropdown
      id="pivot-selector"
      size="small"
      label={T.translate("sponsor_reports_page.group_by")}
      value={value}
      options={PIVOTS.map((p) => ({
        value: p.key,
        label: T.translate(p.labelKey)
      }))}
      onChange={(e) => onChange(e.target.value)}
    />
  </Box>
);

export default PivotSelector;
