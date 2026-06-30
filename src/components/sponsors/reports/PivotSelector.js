import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import T from "i18n-react/dist/i18n-react";
import { PIVOTS } from "./pivot-defs";

const PivotSelector = ({ value, onChange }) => (
  <FormControl size="small" sx={{ minWidth: 280 }}>
    <InputLabel id="pivot-selector-label">
      {T.translate("sponsor_reports_page.group_by")}
    </InputLabel>
    <Select
      labelId="pivot-selector-label"
      label={T.translate("sponsor_reports_page.group_by")}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {PIVOTS.map((p) => (
        <MenuItem key={p.key} value={p.key}>
          {p.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default PivotSelector;
