/**
 * Copyright 2018 OpenStack Foundation
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

import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import T from "i18n-react/dist/i18n-react";
import { Box, Container, Tab, Tabs } from "@mui/material";
import SponsorForm from "../../components/forms/sponsor-form";
import {
  saveSponsor,
  resetSponsorForm,
  addMemberToSponsor,
  removeMemberFromSponsor,
  createCompany,
  deleteSponsorAdvertisement,
  deleteSponsorMaterial,
  deleteSponsorSocialNetwork,
  removeSponsorImage,
  attachSponsorImage,
  getSponsorAdvertisements,
  getSponsorMaterials,
  getSponsorSocialNetworks,
  updateSponsorAdsOrder,
  updateSponsorMaterialOrder,
  deleteExtraQuestion,
  updateExtraQuestionOrder,
  getSponsorLeadReportSettingsMeta,
  upsertSponsorLeadReportSettings
} from "../../actions/sponsor-actions";
import Member from "../../models/member";
import AddNewButton from "../../components/buttons/add-new-button";

const CustomTabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index) => ({
  id: `simple-tab-${index}`,
  "aria-controls": `simple-tabpanel-${index}`
});

const EditSponsorPage = (props) => {
  const {
    currentSummit,
    entity,
    errors,
    history,
    sponsorships,
    member,
    saveSponsor,
    resetSponsorForm,
    addMemberToSponsor,
    removeMemberFromSponsor,
    createCompany,
    deleteSponsorAdvertisement,
    deleteSponsorMaterial,
    deleteSponsorSocialNetwork,
    removeSponsorImage,
    attachSponsorImage,
    getSponsorAdvertisements,
    getSponsorMaterials,
    getSponsorSocialNetworks,
    updateSponsorAdsOrder,
    updateSponsorMaterialOrder,
    deleteExtraQuestion,
    updateExtraQuestionOrder,
    getSponsorLeadReportSettingsMeta,
    upsertSponsorLeadReportSettings
  } = props;

  const memberObj = new Member(member);
  const canEditSponsors = memberObj.canEditSponsors();
  const canEditSponsorExtraQuestions = memberObj.canEditSponsorExtraQuestions();
  const canEditLeadReportSettings = memberObj.canEditLeadReportSettings();

  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const title = entity.id
    ? T.translate("general.edit")
    : T.translate("general.add");

  useEffect(() => {
    if (entity.id > 0) {
      getSponsorAdvertisements(entity.id);
      getSponsorMaterials(entity.id);
      getSponsorSocialNetworks(entity.id);
      getSponsorLeadReportSettingsMeta(entity.id);
    } else {
      resetSponsorForm();
    }
  }, [entity.id]);

  const tabs = [
    { label: "general", value: 0 },
    { label: "users", value: 1 },
    { label: "pages", value: 2 },
    { label: "media uploads", value: 3 },
    { label: "forms", value: 4 },
    { label: "cart", value: 5 },
    { label: "purchases", value: 6 },
    { label: "badge scans", value: 7 }
  ];

  return (
    <Box>
      <Container maxWidth="lg">
        <Box>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            aria-label="basic tabs example"
          >
            {tabs.map((t) => (
              <Tab
                key={t.value}
                label={t.label}
                value={t.value}
                {...a11yProps(t.value)}
              />
            ))}
          </Tabs>
        </Box>
      </Container>
      <CustomTabPanel value={selectedTab} index={0}>
        <div className="container">
          <h3>
            {title} {T.translate("edit_sponsor.sponsor")}
            <AddNewButton entity={entity} />
          </h3>
          <hr />
          {currentSummit && (
            <SponsorForm
              history={history}
              entity={entity}
              currentSummit={currentSummit}
              sponsorships={sponsorships}
              errors={errors}
              onCreateCompany={createCompany}
              onAttachImage={attachSponsorImage}
              onRemoveImage={removeSponsorImage}
              onAddMember={addMemberToSponsor}
              onRemoveMember={removeMemberFromSponsor}
              onSponsorAdsOrderUpdate={updateSponsorAdsOrder}
              onAdvertisementDelete={deleteSponsorAdvertisement}
              onSponsorMaterialOrderUpdate={updateSponsorMaterialOrder}
              onMaterialDelete={deleteSponsorMaterial}
              onSocialNetworkDelete={deleteSponsorSocialNetwork}
              onSubmit={saveSponsor}
              getSponsorAdvertisements={getSponsorAdvertisements}
              getSponsorMaterials={getSponsorMaterials}
              getSponsorSocialNetworks={getSponsorSocialNetworks}
              canEditSponsors={canEditSponsors}
              canEditSponsorExtraQuestions={canEditSponsorExtraQuestions}
              canEditLeadReportSettings={canEditLeadReportSettings}
              deleteExtraQuestion={deleteExtraQuestion}
              updateExtraQuestionOrder={updateExtraQuestionOrder}
              availableLeadReportColumns={entity.available_lead_report_columns}
              upsertSponsorLeadReportSettings={upsertSponsorLeadReportSettings}
            />
          )}
        </div>
      </CustomTabPanel>
    </Box>
  );
};

const mapStateToProps = ({
  loggedUserState,
  currentSummitState,
  currentSponsorState,
  currentSummitSponsorshipListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  sponsorships: currentSummitSponsorshipListState.sponsorships,
  member: loggedUserState.member,
  ...currentSponsorState
});

export default connect(mapStateToProps, {
  saveSponsor,
  resetSponsorForm,
  addMemberToSponsor,
  removeMemberFromSponsor,
  createCompany,
  deleteSponsorAdvertisement,
  deleteSponsorMaterial,
  deleteSponsorSocialNetwork,
  removeSponsorImage,
  attachSponsorImage,
  getSponsorAdvertisements,
  getSponsorMaterials,
  getSponsorSocialNetworks,
  updateSponsorAdsOrder,
  updateSponsorMaterialOrder,
  deleteExtraQuestion,
  updateExtraQuestionOrder,
  getSponsorLeadReportSettingsMeta,
  upsertSponsorLeadReportSettings
})(EditSponsorPage);
