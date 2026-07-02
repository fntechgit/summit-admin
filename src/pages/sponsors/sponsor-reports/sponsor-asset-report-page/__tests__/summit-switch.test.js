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

// Directly refutes Copilot's "mount-only effect never re-runs on summit change →
// stuck empty" concern for the Sponsor Assets report (the filters and rows effects).
// Unlike index.test.js, this suite keeps the REAL getSponsorAssetFilters /
// getSponsorAssetRows thunks and mocks only uicore getRequest, so we can read which
// summit's URL each mount fetch targets. Mounting under summit 1 then remounting
// under summit 2 (what a SummitIdLayout-driven remount does on a summit switch —
// see summit-id-layout.test.js) fetches the NEW summit each time, never the old one.

import React from "react";
import { act } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import * as methods from "utils/methods";
import { renderWithRedux } from "utils/test-utils";
import SponsorAssetReportPage from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

// Keep the real sponsor-report thunks; mock only uicore getRequest to capture the
// endpoint each fetch hits.
jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

const PAGE_ROUTE = "/app/summits/:summit_id/sponsors/reports/sponsor-assets";

let requestedUrls = [];

const buildState = (summitId) => ({
  sponsorReportsSponsorAssetState: {
    filterOptions: { sponsors: [] },
    rows: [],
    summary: null,
    loading: false,
    readError: null
  },
  currentSummitState: { currentSummit: { id: summitId } }
});

const renderPage = (summitId) => {
  const history = createMemoryHistory({
    initialEntries: [`/app/summits/${summitId}/sponsors/reports/sponsor-assets`]
  });
  return renderWithRedux(
    <Router history={history}>
      <Route path={PAGE_ROUTE} component={SponsorAssetReportPage} />
    </Router>,
    { initialState: buildState(summitId) }
  );
};

describe("SponsorAssetReportPage — mount fetch follows the current summit", () => {
  beforeEach(() => {
    window.SPONSOR_REPORTS_API_URL = "https://reports.test";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    requestedUrls = [];
    getRequest.mockImplementation(
      (_requestAC, _receiveAC, endpoint) => () => () => {
        requestedUrls.push(endpoint);
        return Promise.resolve({
          response: { data: [], last_page: 1, summary: null }
        });
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    getRequest.mockReset();
  });

  it("fetches summit 1 on mount, then summit 2 after a remount — never stuck on the old summit", async () => {
    // Mount under summit 1 → the filters + rows effects fetch that summit's URLs.
    const { unmount } = renderPage(1);
    await act(async () => flushPromises());
    expect(
      requestedUrls.some((u) => u.includes("/summits/1/reports/sponsor-assets"))
    ).toBe(true);

    // Remount under a DIFFERENT current summit — exactly what a summit switch does
    // via the SummitIdLayout gate — and the mount effects re-run for the new summit.
    requestedUrls = [];
    unmount();
    renderPage(2);
    await act(async () => flushPromises());

    expect(
      requestedUrls.some((u) => u.includes("/summits/2/reports/sponsor-assets"))
    ).toBe(true);
    // Not stuck on the old summit.
    expect(requestedUrls.every((u) => !u.includes("/summits/1/"))).toBe(true);
  });
});
