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
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import Member from "../../models/member";
import {
  getLeadReportSettingsMeta,
  upsertLeadReportSettings,
  getLeadReportSettingsBySummit
} from "../../actions/summit-actions";
import {
  denormalizeLeadReportSettings,
  getSummitLeadReportSettings,
  renderOptions
} from "../../models/lead-report-settings";
import ChipSelectInput from "../mui/chip-select-input";

const LeadReportForm = ({
  currentSummit,
  member,
  upsertLeadReportSettings,
  getLeadReportSettingsMeta,
  getLeadReportSettingsBySummit
}) => {
  const memberObj = new Member(member);
  const availableLeadReportColumns =
    currentSummit.available_lead_report_columns;
  const canAddSponsors = memberObj.canAddSponsors();
  const canEditLeadReportSettings = memberObj.canEditLeadReportSettings();
  const inputLabel = T.translate(
    "sponsor_list.placeholders.lead_report_columns"
  );
  const currentSettings = getSummitLeadReportSettings(currentSummit);

  return (
    <ChipSelectInput
      availableOptions={availableLeadReportColumns}
      canAdd={canAddSponsors}
      canEdit={canEditLeadReportSettings}
      inputLabel={inputLabel}
      currentSettings={currentSettings}
      onGetSettingsMeta={getLeadReportSettingsMeta}
      onGetSettings={getLeadReportSettingsBySummit}
      onUpsertSettings={upsertLeadReportSettings}
      renderSelectedOptions={renderOptions}
      denormalizeSettings={denormalizeLeadReportSettings}
    />
  );
};

const mapStateToProps = ({ loggedUserState, currentSummitState }) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member
});

export default connect(mapStateToProps, {
  getLeadReportSettingsMeta,
  upsertLeadReportSettings,
  getLeadReportSettingsBySummit
})(LeadReportForm);
