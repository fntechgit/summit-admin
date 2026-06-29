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
  getSponsorAssetReport: jest.fn(() => ({ type: "GET_SA_REPORT" })),
  exportSponsorAssetCsv: jest.fn(() => ({ type: "EXPORT_SA_CSV" })),
  SPONSOR_ASSET_READ_ERROR: "SPONSOR_ASSET_READ_ERROR"
}));

// Require after mocks so the jest.fn() references are the mocked ones.
const {
  getSponsorAssetFilters,
  getSponsorAssetReport,
  exportSponsorAssetCsv
} = require("../../../../../actions/sponsor-reports-actions");

const PAGE_ROUTE = "/app/summits/:summit_id/sponsors/reports/sponsor-assets";
const PAGE_URL = "/app/summits/42/sponsors/reports/sponsor-assets";

const sponsorCards = [
  {
    sponsor: {
      id: 17,
      name: "Acme",
      company_name: "Acme Inc",
      tier: "Gold",
      logo_url: null
    },
    component_count: 3,
    status_rollup: {
      completed: 1,
      in_progress: 1,
      pending: 1,
      not_applicable: 0
    }
  }
];

function buildState(assetOverrides = {}) {
  return {
    sponsorReportsSponsorAssetState: {
      filterOptions: { sponsors: [{ id: 17, name: "Acme" }] },
      data: sponsorCards,
      currentPage: 1,
      lastPage: 1,
      summary: {
        total: 3,
        by_status: {
          completed: 1,
          in_progress: 1,
          pending: 1,
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
  it("dispatches getSponsorAssetFilters (no args) and getSponsorAssetReport on mount", async () => {
    renderPage();
    await act(async () => {});
    expect(getSponsorAssetFilters).toHaveBeenCalledWith();
    // moduleType: "Media" is hard-wired (collected only).
    expect(getSponsorAssetReport).toHaveBeenCalledWith(
      expect.objectContaining({ moduleType: "Media" }),
      expect.objectContaining({ groupBy: "sponsor" })
    );
  });

  it("dispatches getSponsorAssetReport with group_by=component when the Component toggle is clicked", async () => {
    renderPage({ data: [], currentPage: 1, lastPage: 1 });
    await act(async () => {});
    getSponsorAssetReport.mockClear();

    fireEvent.click(
      screen.getByRole("button", {
        name: "sponsor_reports_page.group_by_component"
      })
    );
    await act(async () => {});

    expect(getSponsorAssetReport).toHaveBeenCalled();
    const lastCall =
      getSponsorAssetReport.mock.calls[
        getSponsorAssetReport.mock.calls.length - 1
      ];
    // Second arg is the options object — thunk converts groupBy → group_by internally.
    expect(lastCall[1]).toEqual(
      expect.objectContaining({ groupBy: "component" })
    );
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

  it("renders the sponsor cards when data holds sponsor-shaped cards", async () => {
    renderPage();
    await act(async () => {});
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("renders pagination and dispatches getSponsorAssetReport with new page on a page change", async () => {
    renderPage({ lastPage: 3, currentPage: 1 });
    await act(async () => {});
    getSponsorAssetReport.mockClear();

    // Clicking page 2 button in MUI Pagination
    const nav = screen.getByRole("navigation");
    const page2 = Array.from(nav.querySelectorAll("button")).find((b) =>
      b.textContent.includes("2")
    );
    fireEvent.click(page2);
    await act(async () => {});

    expect(getSponsorAssetReport).toHaveBeenCalled();
    const calledOptions =
      getSponsorAssetReport.mock.calls[
        getSponsorAssetReport.mock.calls.length - 1
      ][1];
    // Second arg is the options object containing page, groupBy, perPage.
    expect(calledOptions).toMatchObject({ page: 2 });
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
            data: [],
            currentPage: 0,
            lastPage: 0,
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
    expect(getSponsorAssetReport).not.toHaveBeenCalled();
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

  it("fetches with moduleType=Media (hard-wired collected mode)", async () => {
    renderPage();
    await act(async () => {});
    const firstArg =
      getSponsorAssetReport.mock.calls[
        getSponsorAssetReport.mock.calls.length - 1
      ][0];
    expect(firstArg).toEqual(expect.objectContaining({ moduleType: "Media" }));
  });

  it("hides the no-groups empty state until currentPage >= 1", async () => {
    renderPage({ data: [], currentPage: 0, lastPage: 0 });
    await act(async () => {});
    expect(screen.queryByTestId("reports-no-groups")).not.toBeInTheDocument();

    jest.clearAllMocks();
    renderPage({ data: [], currentPage: 1, lastPage: 1 });
    await act(async () => {});
    expect(screen.getAllByTestId("reports-no-groups").length).toBeGreaterThan(
      0
    );
  });
});
