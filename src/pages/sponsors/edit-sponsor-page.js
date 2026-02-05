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
import { Box, Container, Tab, Tabs, Typography } from "@mui/material";
import {
  saveSponsor,
  resetSponsorForm,
  getSponsorAdvertisements,
  getSponsorMaterials,
  getSponsorSocialNetworks,
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
  updateExtraQuestionOrder,
  getExtraQuestionMeta
} from "../../actions/sponsor-actions";
import SponsorGeneralForm from "../../components/forms/sponsor-general-form/index";
import SponsorUsersListPerSponsorPage from "./sponsor-users-list-per-sponsor";
import SponsorFormsTab from "./sponsor-forms-tab";
import SponsorBadgeScans from "./sponsor-badge-scans";
import SponsorCartTab from "./sponsor-cart-tab";
import SponsorFormsManageItems from "./sponsor-forms-tab/components/manage-items/sponsor-forms-manage-items";
import { SPONSOR_TABS } from "../../utils/constants";

export const tabsToFragmentMap = [
  "general",
  "users",
  "pages",
  "media_uploads",
  "forms",
  "cart",
  "purchases",
  "badge_scans"
];

export const getFragmentFromValue = (index) => tabsToFragmentMap[index];

export const getTabFromUrlFragment = () => {
  const currentHash = window.location.hash.replace("#", "");
  const result = tabsToFragmentMap.indexOf(currentHash);
  if (result > -1) return result;
  return 0;
};

export const CustomTabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      data-testid={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const a11yProps = (index) => ({
  id: `simple-tab-${index}`,
  "aria-controls": `simple-tabpanel-${index}`
});

const EditSponsorPage = (props) => {
  const {
    entity,
    member,
    history,
    location,
    match,
    currentSummit,
    resetSponsorForm,
    getSponsorAdvertisements,
    getSponsorMaterials,
    getSponsorSocialNetworks,
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
    updateExtraQuestionOrder,
    getExtraQuestionMeta
  } = props;

  const [selectedTab, setSelectedTab] = useState(getTabFromUrlFragment());

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);

    const basePath = `/app/summits/${currentSummit.id}/sponsors/${entity.id}`;
    const fragment = getFragmentFromValue(newValue);

    // restore location if it comes from a nested route
    if (location.pathname !== basePath) {
      history.push(`${basePath}#${fragment}`);
    } else {
      window.location.hash = fragment;
    }
  };

  useEffect(() => {
    const onHashChange = () => setSelectedTab(getTabFromUrlFragment());
    window.addEventListener("hashchange", onHashChange);
    // default call
    if (!window.location.hash) handleTabChange(null, getTabFromUrlFragment());
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (entity.id > 0) {
      getSponsorAdvertisements(entity.id);
      getSponsorMaterials(entity.id);
      getSponsorSocialNetworks(entity.id);
      getSponsorLeadReportSettingsMeta(entity.id);
      getSponsorTiers(entity.id);
      getExtraQuestionMeta();
    } else {
      resetSponsorForm();
    }
  }, [entity.id]);

  const handleSponsorshipPaginate = (page, perPage, order, orderDir) => {
    getSponsorTiers(entity.id, page, perPage, order, orderDir);
  };

  const tabs = [
    {
      label: T.translate("edit_sponsor.tab.general"),
      value: SPONSOR_TABS.GENERAL
    },
    { label: T.translate("edit_sponsor.tab.users"), value: SPONSOR_TABS.USERS },
    { label: T.translate("edit_sponsor.tab.pages"), value: SPONSOR_TABS.PAGES },
    {
      label: T.translate("edit_sponsor.tab.media_uploads"),
      value: SPONSOR_TABS.MEDIA_UPLOADS
    },
    { label: T.translate("edit_sponsor.tab.forms"), value: SPONSOR_TABS.FORMS },
    { label: T.translate("edit_sponsor.tab.cart"), value: SPONSOR_TABS.CART },
    {
      label: T.translate("edit_sponsor.tab.purchases"),
      value: SPONSOR_TABS.PURCHASES
    },
    {
      label: T.translate("edit_sponsor.tab.badge_scans"),
      value: SPONSOR_TABS.BADGE_SCANS
    }
  ];

  const sponsorFormItemRoute =
    location.pathname.includes("/sponsor-forms/") &&
    location.pathname.includes("/items");

  return (
    <Box>
      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Typography fontSize="3.4rem" variant="h4">
          {entity.company?.name}
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            sx={{
              minHeight: "36px"
            }}
          >
            {tabs.map((t) => (
              <Tab
                key={t.value}
                label={t.label}
                value={t.value}
                onClick={() => handleTabChange(null, t.value)}
                sx={{
                  fontSize: "1.4rem",
                  lineHeight: "1.8rem",
                  height: "36px",
                  minHeight: "36px",
                  px: 2,
                  py: 1
                }}
                {...a11yProps(t.value)}
              />
            ))}
          </Tabs>
        </Box>
        <CustomTabPanel value={selectedTab} index={0}>
          <SponsorGeneralForm
            sponsor={entity}
            member={member}
            summit={currentSummit}
            onSponsorshipPaginate={handleSponsorshipPaginate}
            onSponsorshipAdd={addTierToSponsor}
            onSponsorshipDelete={removeTierFromSponsor}
            getSponsorshipAddons={getSponsorshipAddons}
            onSponsorshipSelect={setSelectedSponsorship}
            onSponsorshipAddonSave={saveAddonsToSponsorship}
            onSponsorshipAddonRemove={removeAddonToSponsorship}
            getSponsorLeadReportSettingsMeta={getSponsorLeadReportSettingsMeta}
            upsertSponsorLeadReportSettings={upsertSponsorLeadReportSettings}
            getSponsorExtraQuestion={getSponsorExtraQuestion}
            saveSponsorExtraQuestion={saveSponsorExtraQuestion}
            saveSponsorExtraQuestionValue={saveSponsorExtraQuestionValue}
            resetSponsorExtraQuestionForm={resetSponsorExtraQuestionForm}
            onExtraQuestionDelete={deleteExtraQuestion}
            onExtraQuestionReOrder={updateExtraQuestionOrder}
          />
        </CustomTabPanel>
        <CustomTabPanel value={selectedTab} index={1}>
          <SponsorUsersListPerSponsorPage sponsor={entity} />
        </CustomTabPanel>
        <CustomTabPanel value={selectedTab} index={4}>
          {sponsorFormItemRoute ? (
            <SponsorFormsManageItems match={match} />
          ) : (
            <SponsorFormsTab
              sponsor={entity}
              summitId={currentSummit.id}
              history={history}
            />
          )}
        </CustomTabPanel>
        <CustomTabPanel value={selectedTab} index={5}>
          <SponsorCartTab sponsor={entity} summitId={currentSummit.id} />
        </CustomTabPanel>
        <CustomTabPanel value={selectedTab} index={7}>
          <SponsorBadgeScans sponsor={entity} />
        </CustomTabPanel>
      </Container>
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
  getSponsorAdvertisements,
  getSponsorMaterials,
  getSponsorSocialNetworks,
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
  updateExtraQuestionOrder,
  getExtraQuestionMeta
})(EditSponsorPage);
