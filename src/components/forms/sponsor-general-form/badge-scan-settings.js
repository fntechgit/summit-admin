/**
 * Copyright 2026 OpenStack Foundation
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

import React from "react";
import T from "i18n-react/dist/i18n-react";
import { Box, Divider, Grid2, Typography } from "@mui/material";
import Member from "../../../models/member";
import ChipSelectInput from "../../mui/chip-select-input";
import {
  denormalizeLeadReportSettings,
  renderOptions
} from "../../../models/lead-report-settings";

const BadgeScanSettings = ({
  sponsor,
  member,
  upsertSponsorLeadReportSettings,
  getSponsorLeadReportSettingsMeta
}) => {
  const memberObj = new Member(member);
  const canAddSponsors = memberObj.canAddSponsors();
  const canEditLeadReportSettings = memberObj.canEditLeadReportSettings();
  const availableLeadReportColumns = sponsor.available_lead_report_columns;

  const currentSettings = sponsor.lead_report_setting;

  const inputLabel = T.translate(
    "edit_sponsor.placeholders.badge_scan_settings"
  );

  const selectedCount =
    currentSettings && currentSettings.columns
      ? renderOptions(
          denormalizeLeadReportSettings(currentSettings.columns)
        ).filter((option) =>
          availableLeadReportColumns.some((col) => col.value === option.value)
        ).length
      : 0;

  const handleUpsertSettings = (newValues) => {
    upsertSponsorLeadReportSettings(sponsor.id, newValues);
  };

  const handleGetSponsorLeadReportSettingsMeta = () => {
    getSponsorLeadReportSettingsMeta(sponsor.id);
  };

  return (
    <Box sx={{ px: 2, py: 0, backgroundColor: "#FFF" }}>
      <Grid2 container size={12} sx={{ height: "68px", alignItems: "center" }}>
        <Grid2 size={12}>
          <Typography
            sx={{
              fontWeight: "500",
              letterSpacing: "0.15px",
              fontSize: "2rem",
              lineHeight: "1.6rem"
            }}
          >
            {T.translate("edit_sponsor.badge_scan_settings")}
          </Typography>
        </Grid2>
      </Grid2>
      <Divider />
      <Grid2 container size={12} sx={{ height: "68px", alignItems: "center" }}>
        <Grid2 size={12}>
          <Typography
            sx={{
              fontWeight: "400",
              letterSpacing: "0.15px",
              fontSize: "1.6rem",
              lineHeight: "150%",
              textTransform: "lowercase"
            }}
          >
            {selectedCount} {T.translate("edit_sponsor.badge_scan_settings")}
          </Typography>
        </Grid2>
      </Grid2>
      <Divider />
      <Grid2 container size={12} sx={{ py: 3, alignItems: "center" }}>
        <Grid2 size={12}>
          <ChipSelectInput
            availableOptions={availableLeadReportColumns}
            canAdd={canAddSponsors}
            canEdit={canEditLeadReportSettings}
            inputLabel={inputLabel}
            currentSettings={currentSettings}
            onGetSettingsMeta={handleGetSponsorLeadReportSettingsMeta}
            onUpsertSettings={handleUpsertSettings}
            renderSelectedOptions={renderOptions}
            denormalizeSettings={denormalizeLeadReportSettings}
          />
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default BadgeScanSettings;
