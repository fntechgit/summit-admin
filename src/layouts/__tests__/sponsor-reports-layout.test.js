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
import { screen } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import { renderWithRedux } from "../../utils/test-utils";
import SponsorReportsLayout from "../sponsor-reports-layout";

// Echo translation keys so UnAuthorizedPage's T.translate("errors.not_allowed") → "errors.not_allowed"
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k) => k
}));

// react-breadcrumbs: render a stub so the landing page Breadcrumb doesn't error
jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: ({ data }) => (
    <div data-testid="breadcrumb" data-title={data.title} />
  )
}));

// The connected Purchase Details page calls useSnackbarMessage(); the global
// provider isn't in this layout render, so mock the hook (mirrors the page's
// own test) — otherwise it destructures undefined and throws on render.
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({ useSnackbarMessage: () => ({ errorMessage: jest.fn() }) })
);

// Provide real access-routes data so Restrict/Member gates correctly.
// Without this the YAML transform stub returns "" and hasAccess() always returns true.
jest.mock("../../access-routes.yml", () => ({
  "admin-sponsors": [
    "super-admins",
    "administrators",
    "summit-front-end-administrators"
  ]
}));

// Mock action creators used by the connected child pages.
// Returns plain objects so the mock store can record them without real thunk logic.
jest.mock("../../actions/sponsor-reports-actions", () => ({
  getSponsorAssetSponsor: jest.fn(() => ({ type: "MOCK_GET_DRILLDOWN" })),
  getSponsorAssetFilters: jest.fn(() => ({
    type: "MOCK_GET_SPONSOR_ASSET_FILTERS"
  })),
  getPurchaseDetailsReport: jest.fn(() => ({
    type: "MOCK_GET_PURCHASE_DETAILS"
  })),
  getPurchaseDetailsFilters: jest.fn(() => ({
    type: "MOCK_GET_PURCHASE_DETAILS_FILTERS"
  })),
  SPONSOR_DRILLDOWN_READ_ERROR: "SPONSOR_DRILLDOWN_READ_ERROR",
  PURCHASE_DETAILS_VALIDATION_CLEAR: "PURCHASE_DETAILS_VALIDATION_CLEAR",
  REQUEST_SPONSOR_DRILLDOWN: "REQUEST_SPONSOR_DRILLDOWN",
  RECEIVE_SPONSOR_DRILLDOWN: "RECEIVE_SPONSOR_DRILLDOWN"
}));

const REPORTS_ROUTE = "/app/summits/:summit_id/sponsors/reports";
const REPORTS_URL = "/app/summits/1/sponsors/reports";

const buildState = (groups) => ({
  loggedUserState: {
    member: { groups }
  }
});

const renderLayout = (groups) => {
  const history = createMemoryHistory({ initialEntries: [REPORTS_URL] });
  return renderWithRedux(
    <Router history={history}>
      <Route path={REPORTS_ROUTE} component={SponsorReportsLayout} />
    </Router>,
    { initialState: buildState(groups) }
  );
};

describe("SponsorReportsLayout", () => {
  it("renders the reports landing page (two cards) for an administrator", () => {
    renderLayout([{ code: "administrators" }]);
    expect(
      screen.getByTestId("report-card-purchase-details")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("report-card-sponsor-assets")
    ).toBeInTheDocument();
  });

  it("renders UnAuthorizedPage for a sponsors-only member", () => {
    renderLayout([{ code: "sponsors" }]);
    // UnAuthorizedPage renders: <h1>Sorry... </h1>
    expect(screen.getByText("Sorry...")).toBeInTheDocument();
    expect(
      screen.queryByTestId("report-card-purchase-details")
    ).not.toBeInTheDocument();
  });
});
