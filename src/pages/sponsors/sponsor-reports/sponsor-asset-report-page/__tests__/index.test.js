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

// src/pages/sponsors/sponsor-reports/sponsor-asset-report-page/__tests__/index.test.js

import "@testing-library/jest-dom";
import React from "react";
import { act, screen, fireEvent } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import { renderWithRedux } from "utils/test-utils";
import SponsorAssetReportPage from "../index";

// Echo i18n keys so T.translate("sponsor_reports_page.foo") → "sponsor_reports_page.foo"
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k) => k
}));

// Stub action creators — bare redux-mock-store (thunk middleware included via test-utils)
// only needs plain-object return values from these mocked thunks.
jest.mock("../../../../../actions/sponsor-reports-actions", () => ({
  getSponsorAssetFilters: jest.fn(() => ({ type: "GET_SA_FILTERS" })),
  getSponsorAssetRows: jest.fn(() => ({ type: "GET_SA_ROWS" })),
  exportSponsorAssetCsv: jest.fn(() => ({ type: "EXPORT_SA_CSV" }))
}));

// Require after mocks so the jest.fn() references are the mocked ones.
const {
  getSponsorAssetFilters,
  getSponsorAssetRows,
  exportSponsorAssetCsv
} = require("../../../../../actions/sponsor-reports-actions");

const PAGE_ROUTE = "/app/summits/:summit_id/sponsors/reports/sponsor-assets";
const PAGE_URL = "/app/summits/42/sponsors/reports/sponsor-assets";

// Flat row (pivot flow) — one Acme row for the default sponsor→page→component pivot.
const acmeRow = {
  sponsor: {
    id: 17,
    name: "Acme",
    company_name: "Acme Inc",
    tier: "Gold",
    logo_url: null
  },
  page: { id: 1, title: "Home" },
  module: { id: 5, title: "Logo", component_name: "Logo Widget" },
  status: "completed",
  content: {}
};

function buildState(assetOverrides = {}) {
  return {
    sponsorReportsSponsorAssetState: {
      filterOptions: { sponsors: [{ id: 17, name: "Acme" }] },
      rows: [acmeRow],
      summary: {
        total: 1,
        by_status: {
          completed: 1,
          in_progress: 0,
          pending: 0,
          not_applicable: 0
        }
      },
      loading: false,
      readError: null,
      ...assetOverrides
    },
    currentSummitState: {
      currentSummit: { id: 42 }
    }
  };
}

function renderPage(assetOverrides = {}) {
  const history = createMemoryHistory({ initialEntries: [PAGE_URL] });
  return {
    history,
    ...renderWithRedux(
      <Router history={history}>
        <Route path={PAGE_ROUTE} component={SponsorAssetReportPage} />
      </Router>,
      { initialState: buildState(assetOverrides) }
    )
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SponsorAssetReportPage", () => {
  it("dispatches getSponsorAssetFilters (no args) and getSponsorAssetRows on mount", async () => {
    renderPage();
    await act(async () => {});
    expect(getSponsorAssetFilters).toHaveBeenCalledWith();
    expect(getSponsorAssetRows).toHaveBeenCalledWith({});
  });

  it("renders the pivot tree for fetched rows", async () => {
    renderPage();
    await act(async () => {});
    // Default pivot is sponsor→page→component; first node label is the sponsor name.
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("renders the by_status summary tiles from the summary object", async () => {
    renderPage();
    await act(async () => {});
    expect(
      screen.getByText("sponsor_reports_page.status_completed")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.status_in_progress")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.status_pending")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.status_not_applicable")
    ).toBeInTheDocument();
  });

  it("renders the summit-not-found guard when currentSummit is null", async () => {
    const history = createMemoryHistory({ initialEntries: [PAGE_URL] });
    renderWithRedux(
      <Router history={history}>
        <Route path={PAGE_ROUTE} component={SponsorAssetReportPage} />
      </Router>,
      {
        initialState: {
          sponsorReportsSponsorAssetState: {
            filterOptions: null,
            rows: [],
            summary: null,
            loading: false,
            readError: null
          },
          currentSummitState: { currentSummit: null }
        }
      }
    );
    await act(async () => {});
    expect(screen.getByTestId("reports-summit-not-found")).toBeInTheDocument();
    expect(getSponsorAssetFilters).not.toHaveBeenCalled();
    expect(getSponsorAssetRows).not.toHaveBeenCalled();
  });

  it("renders the export button (enabled by default)", async () => {
    renderPage();
    await act(async () => {});
    expect(
      screen.getByRole("button", {
        name: /sponsor_reports_page\.export_csv/
      })
    ).not.toBeDisabled();
  });

  it("dispatches exportSponsorAssetCsv with current filters on export button click", async () => {
    renderPage();
    await act(async () => {});
    exportSponsorAssetCsv.mockClear();

    fireEvent.click(
      screen.getByRole("button", {
        name: /sponsor_reports_page\.export_csv/
      })
    );
    await act(async () => {});

    // moduleType: "Media" is hard-wired (collected only).
    expect(exportSponsorAssetCsv).toHaveBeenCalledWith(
      expect.objectContaining({ moduleType: "Media" })
    );
  });

  it("shows the no-groups empty state when rows is empty", async () => {
    renderPage({ rows: [] });
    await act(async () => {});
    expect(screen.getByTestId("reports-no-groups")).toBeInTheDocument();
  });

  it("does not show the empty state when rows has entries", async () => {
    renderPage();
    await act(async () => {});
    expect(screen.queryByTestId("reports-no-groups")).not.toBeInTheDocument();
  });

  it("renders the read-error block when readError is set", async () => {
    renderPage({ readError: { message: "Something went wrong" }, rows: [] });
    await act(async () => {});
    expect(screen.getByTestId("reports-read-error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
