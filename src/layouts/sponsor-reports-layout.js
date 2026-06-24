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
import { Route, Switch, withRouter } from "react-router-dom";
import Restrict from "../routes/restrict";
import PurchaseDetailsReportPage from "../pages/sponsors/sponsor-reports/purchase-details-report-page";
import SponsorAssetDrilldownPage from "../pages/sponsors/sponsor-reports/sponsor-asset-drilldown-page";
import SponsorAssetReportPage from "../pages/sponsors/sponsor-reports/sponsor-asset-report-page";

const SponsorReportsLayout = ({ match }) => (
  <div>
    <Switch>
      <Route
        exact
        path={`${match.url}/purchase-details`}
        component={PurchaseDetailsReportPage}
      />
      {/* Drill-down (more specific) FIRST so the base /sponsor-assets route
          cannot shadow it even with exact on both. Belt-and-suspenders ordering
          per React Router v4 Switch semantics (first match wins). */}
      <Route
        exact
        path={`${match.url}/sponsor-assets/sponsors/:sponsorId`}
        component={SponsorAssetDrilldownPage}
      />
      <Route
        exact
        path={`${match.url}/sponsor-assets`}
        component={SponsorAssetReportPage}
      />
      <Route
        exact
        path={match.url}
        render={() => (
          <div data-testid="sponsor-reports-placeholder">
            <p>Sponsor Reports</p>
          </div>
        )}
      />
    </Switch>
  </div>
);

export default Restrict(withRouter(SponsorReportsLayout), "admin-sponsors");
