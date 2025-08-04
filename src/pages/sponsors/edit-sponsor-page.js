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
  removeTierFromSponsor
} from "../../actions/sponsor-actions";
import SponsorGeneralForm from "../../components/forms/sponsor-general-form/index";

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
    currentSummit,
    resetSponsorForm,
    getSponsorAdvertisements,
    getSponsorMaterials,
    getSponsorSocialNetworks,
    getSponsorLeadReportSettingsMeta,
    getSponsorTiers,
    addTierToSponsor,
    removeTierFromSponsor
  } = props;

  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  useEffect(() => {
    if (entity.id > 0) {
      getSponsorAdvertisements(entity.id);
      getSponsorMaterials(entity.id);
      getSponsorSocialNetworks(entity.id);
      getSponsorLeadReportSettingsMeta(entity.id);
      getSponsorTiers(entity.id);
    } else {
      resetSponsorForm();
    }
  }, [entity.id]);

  const handleSponsorshipPaginate = (page, perPage, order, orderDir) => {
    getSponsorTiers(entity.id, page, perPage, order, orderDir);
  };

  const tabs = [
    { label: T.translate("edit_sponsor.tab.general"), value: 0 },
    { label: T.translate("edit_sponsor.tab.users"), value: 1 },
    { label: T.translate("edit_sponsor.tab.pages"), value: 2 },
    { label: T.translate("edit_sponsor.tab.media_uploads"), value: 3 },
    { label: T.translate("edit_sponsor.tab.forms"), value: 4 },
    { label: T.translate("edit_sponsor.tab.cart"), value: 5 },
    { label: T.translate("edit_sponsor.tab.purchases"), value: 6 },
    { label: T.translate("edit_sponsor.tab.badge_scans"), value: 7 }
  ];

  return (
    <Box>
      <Container maxWidth="lg">
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
            summitId={currentSummit.id}
            onSponsorshipPaginate={handleSponsorshipPaginate}
            onSponsorshipAdd={addTierToSponsor}
            onSponsorshipDelete={removeTierFromSponsor}
          />
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
  removeTierFromSponsor
})(EditSponsorPage);
