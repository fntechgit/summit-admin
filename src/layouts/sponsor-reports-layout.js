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
import { Breadcrumb } from "react-breadcrumbs";
import T from "i18n-react/dist/i18n-react";
import Restrict from "../routes/restrict";
import PurchaseDetailsReportPage from "../pages/sponsors/sponsor-reports/purchase-details-report-page";
import SponsorAssetDrilldownPage from "../pages/sponsors/sponsor-reports/sponsor-asset-drilldown-page";
import SponsorAssetReportPage from "../pages/sponsors/sponsor-reports/sponsor-asset-report-page";
import ReportsLandingPage from "../pages/sponsors/sponsor-reports/reports-landing-page";
import NoMatchPage from "../pages/no-match-page";

// Each sub-route adds its own crumb under the persistent "Reports" crumb, so the
// trail reads .../Sponsors/Reports/<page> (mirrors sponsor-layout's convention).
const withCrumb = (Page, titleKey, pathname) => (props) =>
  (
    <>
      <Breadcrumb
        data={{
          title: T.translate(titleKey),
          pathname: pathname || props.match.url
        }}
      />
      <Page {...props} />
    </>
  );

const SponsorReportsLayout = ({ match }) => (
  <div>
    <Breadcrumb
      data={{
        title: T.translate("sponsor_reports_page.landing_title"),
        pathname: match.url
      }}
    />
    <Switch>
      <Route
        exact
        path={`${match.url}/purchase-details`}
        render={withCrumb(
          PurchaseDetailsReportPage,
          "sponsor_reports_page.purchase_details_title"
        )}
      />
      {/* Drill-down (more specific) FIRST so the base /sponsor-assets route
          cannot shadow it even with exact on both. Belt-and-suspenders ordering
          per React Router v4 Switch semantics (first match wins). The drill-down
          shows the Sponsor Assets parent crumb (links back to the list). */}
      <Route
        exact
        path={`${match.url}/sponsor-assets/sponsors/:sponsorId`}
        render={withCrumb(
          SponsorAssetDrilldownPage,
          "sponsor_reports_page.sponsor_assets_title",
          `${match.url}/sponsor-assets`
        )}
      />
      <Route
        exact
        path={`${match.url}/sponsor-assets`}
        render={withCrumb(
          SponsorAssetReportPage,
          "sponsor_reports_page.sponsor_assets_title"
        )}
      />
      <Route exact path={match.url} component={ReportsLandingPage} />
      {/* Catch-all for unknown /reports/... paths, mirroring sponsor/event
          layouts (otherwise only the breadcrumb shell renders). */}
      <Route component={NoMatchPage} />
    </Switch>
  </div>
);

export default Restrict(withRouter(SponsorReportsLayout), "admin-sponsors");
