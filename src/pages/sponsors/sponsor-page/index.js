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

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { Box, Container, Typography } from "@mui/material";
import { Redirect, Route, Switch } from "react-router-dom";
import {
  getExtraQuestionMeta,
  getSponsorAdvertisements,
  getSponsorLeadReportSettingsMeta,
  getSponsorMaterials,
  getSponsorSocialNetworks,
  getSponsorTiers,
  resetSponsorForm
} from "../../../actions/sponsor-actions";
import { getSponsorPurchasesMeta } from "../../../actions/sponsor-settings-actions";
import TabNav from "./components/tab-nav";
import { SPONSOR_PAGE_TABS } from "./tabDefs";

const SponsorPage = ({
  entity,
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
  getExtraQuestionMeta,
  getSponsorPurchasesMeta
}) => {
  useEffect(() => {
    if (entity.id > 0) {
      getSponsorAdvertisements(entity.id);
      getSponsorMaterials(entity.id);
      getSponsorSocialNetworks(entity.id);
      getSponsorLeadReportSettingsMeta(entity.id);
      getSponsorTiers(entity.id);
      getExtraQuestionMeta();
      getSponsorPurchasesMeta();
    } else {
      resetSponsorForm();
    }
  }, [entity.id]);

  return (
    <Box>
      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Typography fontSize="3.4rem" variant="h4">
          {entity.company?.name}
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
          <TabNav history={history} location={location} />
        </Box>
        <Switch>
          {SPONSOR_PAGE_TABS.map(
            ({ path, exact, strict, component: Component }) => (
              <Route
                key={path}
                exact={exact}
                strict={strict}
                path={`${match.url}${path}`}
                component={Component}
              />
            )
          )}
          <Redirect
            to={`/app/summits/${currentSummit.id}/sponsors/${entity.id}`}
          />
        </Switch>
      </Container>
    </Box>
  );
};

const mapStateToProps = ({
  currentSummitState,
  currentSponsorState,
  currentSummitSponsorshipListState
}) => ({
  currentSummit: currentSummitState.currentSummit,
  sponsorships: currentSummitSponsorshipListState.sponsorships,
  ...currentSponsorState
});

export default connect(mapStateToProps, {
  resetSponsorForm,
  getSponsorAdvertisements,
  getSponsorMaterials,
  getSponsorSocialNetworks,
  getSponsorLeadReportSettingsMeta,
  getSponsorTiers,
  getExtraQuestionMeta,
  getSponsorPurchasesMeta
})(SponsorPage);
