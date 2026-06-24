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

// Provide real access-routes data so Restrict/Member gates correctly.
// Without this the YAML transform stub returns "" and hasAccess() always returns true.
jest.mock("../../access-routes.yml", () => ({
  "admin-sponsors": [
    "super-admins",
    "administrators",
    "summit-front-end-administrators"
  ]
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
  it("renders the reports placeholder for an administrator", () => {
    renderLayout([{ code: "administrators" }]);
    expect(
      screen.getByTestId("sponsor-reports-placeholder")
    ).toBeInTheDocument();
  });

  it("renders UnAuthorizedPage for a sponsors-only member", () => {
    renderLayout([{ code: "sponsors" }]);
    // UnAuthorizedPage renders: <h1>Sorry... </h1>
    expect(screen.getByText("Sorry...")).toBeInTheDocument();
    expect(
      screen.queryByTestId("sponsor-reports-placeholder")
    ).not.toBeInTheDocument();
  });
});
