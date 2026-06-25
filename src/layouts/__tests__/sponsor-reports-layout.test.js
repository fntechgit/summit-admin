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

// Provide real access-routes data so Restrict/Member gates correctly.
// Without this the YAML transform stub returns "" and hasAccess() always returns true.
jest.mock("../../access-routes.yml", () => ({
  "admin-sponsors": [
    "super-admins",
    "administrators",
    "summit-front-end-administrators"
  ]
}));

// Mock reports-api so child pages can build URLs without a real API host.
jest.mock("../../utils/reports-api", () => ({
  getReportsApiBaseUrl: () => "http://test-api",
  isPositiveIntId: (v) => /^[1-9]\d*$/.test(String(v))
}));

// Mock action creators used by the connected child pages.
// Returns plain objects so the mock store can record them without real thunk logic.
jest.mock("../../actions/sponsor-reports-actions", () => ({
  getSponsorAssetSponsor: jest.fn(() => ({ type: "MOCK_GET_DRILLDOWN" })),
  getSponsorAssetReport: jest.fn(() => ({ type: "MOCK_GET_SPONSOR_ASSET" })),
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

  it("renders the drilldown page (not the landing) when navigating to the deep sponsor-assets/sponsors/:sponsorId path as admin", () => {
    // Integration test: mounts the REAL Restrict-wrapped SponsorReportsLayout and
    // navigates to the drilldown sub-route so the Switch routes to SponsorAssetDrilldownPage
    // rather than the landing. Proves the route table resolves the deep path end-to-end
    // through the admin gate, not just the list/landing.
    const DRILLDOWN_URL =
      "/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17";
    const history = createMemoryHistory({ initialEntries: [DRILLDOWN_URL] });

    renderWithRedux(
      <Router history={history}>
        <Route path={REPORTS_ROUTE} component={SponsorReportsLayout} />
      </Router>,
      {
        initialState: {
          loggedUserState: {
            member: { groups: [{ code: "administrators" }] }
          },
          currentSummitState: { currentSummit: { id: 1 } },
          sponsorReportsDrilldownState: {
            detail: null,
            loading: true,
            readError: null
          }
        }
      }
    );

    // The drilldown page renders its loading indicator — the landing cards are absent.
    expect(
      screen.getByText("sponsor_reports_page.loading")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("report-card-purchase-details")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("report-card-sponsor-assets")
    ).not.toBeInTheDocument();
  });

  it("renders the Reports → Purchase Details breadcrumb trail on the sub-route", () => {
    const PD_URL = "/app/summits/1/sponsors/reports/purchase-details";
    const history = createMemoryHistory({ initialEntries: [PD_URL] });
    renderWithRedux(
      <Router history={history}>
        <Route path={REPORTS_ROUTE} component={SponsorReportsLayout} />
      </Router>,
      {
        initialState: {
          loggedUserState: {
            member: { groups: [{ code: "administrators" }] }
          },
          currentSummitState: { currentSummit: { id: 1 } },
          sponsorReportsPurchaseDetailsState: {
            data: [],
            summary: null,
            filterOptions: null,
            total: 0,
            readError: null,
            validationError: null
          },
          sponsorReportsPurchaseDetailsLinesState: {
            data: [],
            summary: null,
            total: 0,
            currentPage: 1,
            lastPage: 1,
            perPage: 50,
            loading: false,
            readError: null
          }
        }
      }
    );
    // The persistent "Reports" crumb + the route's "Purchase Details" crumb both render.
    const titles = screen
      .getAllByTestId("breadcrumb")
      .map((el) => el.getAttribute("data-title"));
    expect(titles).toContain("sponsor_reports_page.landing_title");
    expect(titles).toContain("sponsor_reports_page.purchase_details_title");
  });
});
