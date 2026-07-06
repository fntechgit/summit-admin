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
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  getSponsorAssetRows
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
      // Active filters live in the reducer now (recorded by the fetch thunk) and
      // arrive as a prop; loading was removed (global overlay owns it).
      filters: {},
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

  it("renders a Status single-select (Completed/In Progress/Pending) and applies status== on Apply", async () => {
    renderPage();
    await act(async () => {});
    // MUI Select renders role="combobox" named by its InputLabel (i18n mock echoes the key).
    await act(async () => {
      await userEvent.click(
        screen.getByRole("combobox", {
          name: "sponsor_reports_page.filter_asset_status"
        })
      );
    });
    // Options are the three displayable statuses; labels echo the i18n keys.
    expect(
      screen.getByRole("option", {
        name: "sponsor_reports_page.status_completed"
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: "sponsor_reports_page.status_in_progress"
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", {
        name: "sponsor_reports_page.status_pending"
      })
    ).toBeInTheDocument();
    // Pick Completed, then Apply → server refetch carries status=="completed".
    await act(async () => {
      await userEvent.click(
        screen.getByRole("option", {
          name: "sponsor_reports_page.status_completed"
        })
      );
    });
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "sponsor_reports_page.apply" })
      );
    });
    expect(getSponsorAssetRows).toHaveBeenLastCalledWith({
      status: "completed"
    });
  });

  it("renders the by_status summary tiles from the summary object", async () => {
    // rows:[] so the tiles (from summary.by_status) are the only place the status
    // labels appear — a seeded row would also render a translated StatusPill and
    // collide with the tile text under the key-echo i18n mock.
    renderPage({ rows: [] });
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
    // N/A tile dropped — report is scoped to Media, which never yields N/A.
    expect(
      screen.queryByText("sponsor_reports_page.status_not_applicable")
    ).not.toBeInTheDocument();
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
            filters: {},
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

  it("shows the no-groups empty state when rows is empty", async () => {
    renderPage({ rows: [] });
    await act(async () => {});
    expect(screen.getByTestId("reports-no-groups")).toBeInTheDocument();
  });

  it("a superseded fetch does not flash the empty state (generation guard)", async () => {
    // Two controllable fetches: the mount fetch (gen 1) and an Apply fetch
    // (gen 2). The OLDER one resolves while the NEWER is still pending — its
    // finalizer must be ignored, or hasFetched flips on and flashes the empty
    // state before the latest result lands. Mocked thunks return the deferred
    // promise (thunk middleware passes it straight through).
    let resolveOld;
    let resolveNew;
    const oldFetch = new Promise((r) => {
      resolveOld = r;
    });
    const newFetch = new Promise((r) => {
      resolveNew = r;
    });
    getSponsorAssetRows
      .mockReturnValueOnce(() => oldFetch) // mount → gen 1
      .mockReturnValueOnce(() => newFetch); // apply → gen 2

    renderPage({ rows: [] });
    await act(async () => {}); // gen 1 dispatched, still pending

    // Supersede gen 1 with an Apply (gen 2), also left pending.
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "sponsor_reports_page.apply" })
      );
    });

    // Old (gen 1) settles first, while gen 2 is pending — guard must ignore it.
    await act(async () => {
      resolveOld();
    });
    expect(screen.queryByTestId("reports-no-groups")).not.toBeInTheDocument();

    // The latest fetch settling is what reveals the (still empty) result.
    await act(async () => {
      resolveNew();
    });
    expect(screen.getByTestId("reports-no-groups")).toBeInTheDocument();
  });
});
