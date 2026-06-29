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

// src/pages/sponsors/sponsor-reports/sponsor-asset-drilldown-page/__tests__/index.test.js

import "@testing-library/jest-dom";
import React from "react";
import { act, screen, fireEvent } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import { renderWithRedux } from "utils/test-utils";
import SponsorAssetDrilldownPage from "../index";

// Echo i18n keys verbatim.
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k) => k
}));

jest.mock("../../../../../actions/sponsor-reports-actions", () => ({
  getSponsorAssetSponsor: jest.fn(() => ({ type: "GET_DRILLDOWN" })),
  exportSponsorAssetSectionCsv: jest.fn(() => ({
    type: "EXPORT_SA_SECTION_CSV"
  })),
  SPONSOR_DRILLDOWN_READ_ERROR: "SPONSOR_DRILLDOWN_READ_ERROR"
}));

const {
  getSponsorAssetSponsor,
  exportSponsorAssetSectionCsv
} = require("../../../../../actions/sponsor-reports-actions");

const PAGE_ROUTE =
  "/app/summits/:summit_id/sponsors/reports/sponsor-assets/sponsors/:sponsorId";

function buildState(drilldownOverrides = {}) {
  return {
    sponsorReportsDrilldownState: {
      detail: null,
      loading: false,
      readError: null,
      ...drilldownOverrides
    },
    currentSummitState: {
      currentSummit: { id: 1 }
    }
  };
}

function renderAt(url, drilldownOverrides = {}) {
  const history = createMemoryHistory({ initialEntries: [url] });
  return {
    history,
    ...renderWithRedux(
      <Router history={history}>
        <Route path={PAGE_ROUTE} component={SponsorAssetDrilldownPage} />
      </Router>,
      { initialState: buildState(drilldownOverrides) }
    )
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SponsorAssetDrilldownPage", () => {
  it("dispatches getSponsorAssetSponsor(sponsorId) on mount — no summitId arg (summit from state)", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      loading: true
    });
    await act(async () => {});
    // Task-2 thunk: getSponsorAssetSponsor(sponsorId) only; summit comes from getState inside thunk.
    expect(getSponsorAssetSponsor).toHaveBeenCalledWith("17");
    expect(getSponsorAssetSponsor).toHaveBeenCalledTimes(1);
  });

  it("renders not-found and skips the fetch for a malformed sponsorId (sponsorId=0)", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/0");
    await act(async () => {});
    expect(screen.getByTestId("sponsor-not-found")).toBeInTheDocument();
    expect(getSponsorAssetSponsor).not.toHaveBeenCalled();
  });

  it("renders not-found state on a 404 readError", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      readError: { kind: "not-found", message: "Sponsor not found" }
    });
    await act(async () => {});
    expect(screen.getByTestId("sponsor-not-found")).toBeInTheDocument();
  });

  it("renders the sponsor header, page sections, and module rows from the real detail shape", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: { id: 17, name: "Acme", tier: "Gold", pages_active: 3 },
        pages: [
          {
            page: { id: 9, title: "Booth", type: "page" },
            modules: [
              {
                module: { id: 1, title: "Logo", type: "Media" },
                status: "completed"
              }
            ]
          }
        ]
      }
    });
    await act(async () => {});
    // Sponsor name appears in both the ReportShell title (h5) and the navy header (h6)
    expect(screen.getAllByText("Acme").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Booth")).toBeInTheDocument();
    expect(screen.getByText("Logo")).toBeInTheDocument();
  });

  it("renders the section download button and dispatches exportSponsorAssetSectionCsv on click", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: { id: 17, name: "Acme", tier: "Gold", pages_active: 1 },
        pages: [
          {
            page: { id: 9, title: "Booth", type: "page" },
            // At least one Media module so the section is not filtered out in collected mode.
            modules: [
              {
                module: { id: 1, title: "Logo", type: "Media" },
                status: "completed"
              }
            ]
          }
        ]
      }
    });
    await act(async () => {});
    exportSponsorAssetSectionCsv.mockClear();

    const downloadBtn = screen.getByRole("button", {
      name: /sponsor_reports_page\.download_csv/
    });
    expect(downloadBtn).not.toBeDisabled();
    fireEvent.click(downloadBtn);
    await act(async () => {});

    // sponsorId from URL ("17"), pageId from section.page.id (9)
    expect(exportSponsorAssetSectionCsv).toHaveBeenCalledWith("17", 9);
  });

  it("renders the navy header with tier badge", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: {
          id: 17,
          name: "AcBel Polytech",
          tier: "Gold",
          pages_active: 3
        },
        pages: []
      }
    });
    await act(async () => {});
    expect(screen.getAllByText("AcBel Polytech").length).toBeGreaterThanOrEqual(
      1
    );
    // TierBadge renders tier.toUpperCase()
    expect(screen.getByText("GOLD")).toBeInTheDocument();
  });

  it("renders the pages_active count in the sponsor header", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: { id: 17, name: "Acme Corp", tier: "Silver", pages_active: 5 },
        pages: []
      }
    });
    await act(async () => {});
    // With echo mock, T.translate("sponsor_reports_page.pages_active") → the key
    expect(
      screen.getByText("sponsor_reports_page.pages_active")
    ).toBeInTheDocument();
  });

  it("shows the sponsor-no-submissions state when the sponsor has no pages", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: { id: 17, name: "Acme", tier: "Gold" },
        pages: []
      }
    });
    await act(async () => {});
    expect(screen.getByTestId("sponsor-no-submissions")).toBeInTheDocument();
  });

  it("ContentCell: image row renders <img> with preview_url", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: { id: 17, name: "Acme", tier: "Gold", pages_active: 2 },
        pages: [
          {
            page: { id: 9, title: "Booth", type: "page" },
            modules: [
              {
                module: { id: 1, title: "Logo", type: "Media" },
                status: "completed",
                content: {
                  filename: "logo.png",
                  preview_url: "https://x/logo.png"
                }
              }
            ]
          }
        ]
      }
    });
    await act(async () => {});
    expect(screen.getByRole("img", { name: /logo/i })).toHaveAttribute(
      "src",
      "https://x/logo.png"
    );
  });

  it("ContentCell: shows pending_upload placeholder when there is no url or text", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: { id: 17, name: "Acme", tier: "Bronze", pages_active: 1 },
        pages: [
          {
            page: { id: 9, title: "Booth", type: "page" },
            modules: [
              {
                module: { id: 3, title: "Empty", type: "Media" },
                status: "pending"
              }
            ]
          }
        ]
      }
    });
    await act(async () => {});
    expect(
      screen.getByText("sponsor_reports_page.pending_upload")
    ).toBeInTheDocument();
  });

  it("shows only collected Media content: only Media module cards render; a section with only non-Media rows is absent", async () => {
    renderAt("/app/summits/1/sponsors/reports/sponsor-assets/sponsors/17", {
      detail: {
        sponsor: { id: 17, name: "Acme", tier: "Gold", pages_active: 2 },
        pages: [
          {
            page: { id: 9, title: "Booth", type: "page" },
            modules: [
              {
                module: { id: 1, title: "Logo", type: "Media" },
                status: "completed"
              },
              {
                module: { id: 2, title: "Deck", type: "Document" },
                status: "pending"
              },
              {
                module: { id: 3, title: "Blurb", type: "Info" },
                status: "pending"
              }
            ]
          },
          {
            page: { id: 10, title: "Branding", type: "page" },
            modules: [
              {
                module: { id: 4, title: "PDF Only", type: "Document" },
                status: "pending"
              }
            ]
          }
        ]
      }
    });
    await act(async () => {});

    // Media card is visible.
    expect(screen.getByText("Logo")).toBeInTheDocument();
    // Document and Info module cards are not rendered.
    expect(screen.queryByText("Deck")).not.toBeInTheDocument();
    expect(screen.queryByText("Blurb")).not.toBeInTheDocument();
    // A section whose only modules are non-Media is not rendered.
    expect(screen.queryByText("Branding")).not.toBeInTheDocument();
  });
});
