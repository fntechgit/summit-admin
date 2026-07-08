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
import { screen, act } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../utils/test-utils";
import { getSummitById } from "../../actions/summit-actions";
import SummitIdLayout from "../summit-id-layout";

// Echo translation keys so the breadcrumb title doesn't need real i18n data.
jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

// SummitIdLayout renders the Breadcrumb only AFTER its gate opens (it returns null
// otherwise), so the breadcrumb's presence is our signal that the gated subtree
// mounted.
jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => <div data-testid="breadcrumb" />
}));

// The gate's mount effect calls getSummitById(...).then(() => setHasLoaded(true)).
// Default: resolve so hasLoaded flips. Individual tests override the implementation
// to hold it pending when they need to isolate the !hasLoaded clause.
jest.mock("../../actions/summit-actions", () => ({
  __esModule: true,
  ...jest.requireActual("../../actions/summit-actions"),
  getSummitById: jest.fn()
}));

// Only loaded when the gate is OPEN and the inner Switch falls through to its
// catch-all; keep it trivial so an open-gate render doesn't drag in a real page.
jest.mock("../../pages/no-match-page", () => ({
  __esModule: true,
  default: () => <div data-testid="no-match" />
}));

const renderAt = (path, currentSummit, loading = false) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  return renderWithRedux(
    <Router history={history}>
      <Route path="/app/summits/:summit_id" component={SummitIdLayout} />
    </Router>,
    { initialState: { currentSummitState: { currentSummit, loading } } }
  );
};

// Flush the getSummitById().then(setHasLoaded) microtask + resulting re-render.
const settle = () => act(async () => flushPromises());

const gateOpen = () => screen.queryByTestId("breadcrumb") !== null;

// Every summit page — including the sponsor-reports pages flagged in review —
// renders inside this gate:
//   PrimaryLayout → SummitLayout → SummitIdLayout → SponsorLayout →
//   SponsorReportsLayout → report pages.
// The gate returns null unless ALL of: currentSummit.id && summitId ===
// currentSummit.id && !loading && hasLoaded. Each negative test below isolates ONE
// clause (the other three are satisfied and hasLoaded is settled true) so that
// deleting that single clause opens the gate and fails the test — pinning the exact
// contract that makes the "mount-only effect never re-runs on summit change" concern
// unreachable: the subtree does not mount until the summit is loaded AND matches the
// URL, and any summit switch (URL summit_id != currentSummit.id) tears it down.
describe("SummitIdLayout summit gate", () => {
  beforeEach(() => {
    getSummitById.mockReset();
    // Resolve by default → hasLoaded flips true after settle().
    getSummitById.mockImplementation(() => () => Promise.resolve());
  });

  it("stays closed on a missing summit id (isolates !currentSummit.id)", async () => {
    // id 0 with a /0 route: summitId === currentSummit.id (0 === 0), !loading,
    // hasLoaded true — so ONLY `!currentSummit.id` keeps it closed.
    renderAt("/app/summits/0/anything", { id: 0 });
    await settle();
    expect(gateOpen()).toBe(false);
  });

  it("stays closed when the URL summit differs from the loaded summit (isolates the mismatch clause / mid-switch unmount)", async () => {
    // id present, !loading, hasLoaded true — so ONLY `summitId !== currentSummit.id`
    // keeps it closed. This is the mid-summit-switch state.
    renderAt("/app/summits/2/anything", { id: 1 });
    await settle();
    expect(gateOpen()).toBe(false);
  });

  it("stays closed while the summit is loading (isolates the loading clause)", async () => {
    // id present, matching, hasLoaded true — so ONLY `loading` keeps it closed.
    renderAt("/app/summits/1/anything", { id: 1 }, true);
    await settle();
    expect(gateOpen()).toBe(false);
  });

  it("stays closed until the summit finishes loading (isolates !hasLoaded)", async () => {
    // Hold getSummitById pending so hasLoaded never flips. id present, matching,
    // !loading — so ONLY `!hasLoaded` keeps it closed.
    getSummitById.mockImplementation(() => () => new Promise(() => {}));
    renderAt("/app/summits/1/anything", { id: 1 });
    await settle();
    expect(gateOpen()).toBe(false);
  });

  it("opens the gated subtree once the summit is loaded and matches the URL (mount / remount)", async () => {
    renderAt("/app/summits/1/anything", { id: 1 });
    await settle();
    expect(gateOpen()).toBe(true);
  });
});
