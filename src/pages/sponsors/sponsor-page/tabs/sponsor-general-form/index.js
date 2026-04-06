/**
 * Copyright 2025 OpenStack Foundation
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
import { Box } from "@mui/material";
import Restrict from "../../../../../routes/restrict";
import SponsorHeader from "./sponsor-header";
import Sponsorship from "./sponsorship";
import BadgeScanSettings from "./badge-scan-settings";
import SponsorExtraQuestions from "./extra-questions";
import {
  addTierToSponsor,
  deleteExtraQuestion,
  getSponsorExtraQuestion,
  getSponsorLeadReportSettingsMeta,
  getSponsorshipAddons,
  getSponsorTiers,
  removeAddonToSponsorship,
  removeTierFromSponsor,
  resetSponsorExtraQuestionForm,
  saveAddonsToSponsorship,
  saveSponsorExtraQuestion,
  saveSponsorExtraQuestionValue,
  setSelectedSponsorship,
  updateExtraQuestionOrder,
  upsertSponsorLeadReportSettings
} from "../../../../../actions/sponsor-actions";
import { ACCESS_ROUTES } from "../../../../../utils/constants";

const SponsorGeneralForm = ({
  sponsor,
  member,
  currentSummit,
  addTierToSponsor,
  removeTierFromSponsor,
  getSponsorshipAddons,
  setSelectedSponsorship,
  saveAddonsToSponsorship,
  removeAddonToSponsorship,
  getSponsorLeadReportSettingsMeta,
  upsertSponsorLeadReportSettings,
  getSponsorExtraQuestion,
  saveSponsorExtraQuestion,
  saveSponsorExtraQuestionValue,
  resetSponsorExtraQuestionForm,
  deleteExtraQuestion,
  updateExtraQuestionOrder
}) => {
  const handleSponsorshipPaginate = (page, perPage, order, orderDir) => {
    getSponsorTiers(sponsor.id, page, perPage, order, orderDir);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <SponsorHeader sponsor={sponsor} />
      <Sponsorship
        sponsor={sponsor}
        summitId={currentSummit.id}
        member={member}
        onSponsorshipPaginate={handleSponsorshipPaginate}
        onSponsorshipAdd={addTierToSponsor}
        onSponsorshipDelete={removeTierFromSponsor}
        getSponsorshipAddons={getSponsorshipAddons}
        onSponsorshipSelect={setSelectedSponsorship}
        onSponsorshipAddonSave={saveAddonsToSponsorship}
        onSponsorshipAddonRemove={removeAddonToSponsorship}
      />
      <BadgeScanSettings
        sponsor={sponsor}
        member={member}
        upsertSponsorLeadReportSettings={upsertSponsorLeadReportSettings}
        getSponsorLeadReportSettingsMeta={getSponsorLeadReportSettingsMeta}
      />
      <SponsorExtraQuestions
        summit={currentSummit}
        sponsorId={sponsor.id}
        extraQuestions={sponsor.extra_questions}
        getSponsorExtraQuestion={getSponsorExtraQuestion}
        resetSponsorExtraQuestionForm={resetSponsorExtraQuestionForm}
        saveSponsorExtraQuestion={saveSponsorExtraQuestion}
        saveSponsorExtraQuestionValue={saveSponsorExtraQuestionValue}
        onExtraQuestionDelete={deleteExtraQuestion}
        onExtraQuestionReOrder={updateExtraQuestionOrder}
      />
    </Box>
  );
};

const mapStateToProps = ({
  loggedUserState,
  currentSummitState,
  currentSponsorState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  member: loggedUserState.member,
  sponsor: currentSponsorState.entity
});

export default Restrict(
  connect(mapStateToProps, {
    getSponsorLeadReportSettingsMeta,
    getSponsorTiers,
    addTierToSponsor,
    removeTierFromSponsor,
    getSponsorshipAddons,
    saveAddonsToSponsorship,
    removeAddonToSponsorship,
    setSelectedSponsorship,
    upsertSponsorLeadReportSettings,
    getSponsorExtraQuestion,
    saveSponsorExtraQuestion,
    saveSponsorExtraQuestionValue,
    resetSponsorExtraQuestionForm,
    deleteExtraQuestion,
    updateExtraQuestionOrder
  })(SponsorGeneralForm),
  ACCESS_ROUTES.SPONSORS
);
