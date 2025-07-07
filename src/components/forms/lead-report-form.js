/**
 * Copyright 2017 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select
} from "@mui/material";
import { ClearIcon } from "@mui/x-date-pickers";
import Member from "../../models/member";
import {
  getLeadReportSettingsMeta,
  upsertLeadReportSettings
} from "../../actions/summit-actions";
import {
  denormalizeLeadReportSettings,
  getSummitLeadReportSettings,
  renderOptions
} from "../../models/lead-report-settings";

const LeadReportForm = ({
  currentSummit,
  member,
  upsertLeadReportSettings,
  getLeadReportSettingsMeta
}) => {
  const memberObj = new Member(member);
  const availableLeadReportColumns =
    currentSummit.available_lead_report_columns;
  const canAddSponsors = memberObj.canAddSponsors();
  const canEditLeadReportSettings = memberObj.canEditLeadReportSettings();
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const inputLabel = T.translate(
    "sponsor_list.placeholders.lead_report_columns"
  );

  useEffect(() => {
    if (currentSummit) {
      getLeadReportSettingsMeta();
      const settings = getSummitLeadReportSettings(currentSummit);
      if (settings) {
        const selectedColumnsTmp = renderOptions(
          denormalizeLeadReportSettings(settings.columns)
        ).map((c) => c.value);
        setSelectedColumns(selectedColumnsTmp);
      }
    }
  }, [currentSummit.lead_report_settings]);

  const submitNewColumns = (newValue) => {
    setSelectedColumns(newValue);
    upsertLeadReportSettings(newValue);
    setIsDirty(false);
  };

  const handleColumnChange = (value) => {
    setSelectedColumns(value);
    setIsDirty(true);
  };

  const handleRemoveItem = (value) => {
    const newValues = selectedColumns.filter((c) => c !== value);
    setSelectedColumns(newValues);
    upsertLeadReportSettings(newValues);
  };

  if (!canAddSponsors || !canEditLeadReportSettings) return null;

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id="lead-report-columns-label">{inputLabel}</InputLabel>
        <Select
          labelId="lead-report-columns-label"
          id="lead-report-columns"
          multiple
          fullWidth
          value={selectedColumns}
          onChange={(ev) => handleColumnChange(ev.target.value)}
          onClose={() => (isDirty ? submitNewColumns(selectedColumns) : null)}
          input={<OutlinedInput label={inputLabel} />}
          renderValue={(selected) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => {
                const op = availableLeadReportColumns.find(
                  (op) => op.value === value
                );
                return (
                  <Chip
                    key={op.value}
                    label={op.label}
                    onDelete={() => {
                      handleRemoveItem(op.value);
                    }}
                    deleteIcon={
                      <ClearIcon
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                      />
                    }
                  />
                );
              })}
            </Box>
          )}
          endAdornment={
            selectedColumns.length > 0 && (
              <InputAdornment sx={{ marginRight: "10px" }} position="end">
                <IconButton
                  onClick={() => {
                    submitNewColumns([]);
                  }}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }
        >
          {availableLeadReportColumns.map(({ value, label }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

const mapStateToProps = ({ loggedUserState, currentSummitState }) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member
});

export default connect(mapStateToProps, {
  getLeadReportSettingsMeta,
  upsertLeadReportSettings
})(LeadReportForm);
