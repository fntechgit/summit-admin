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
import EmailLayout from "../email-layout";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (k) => k }
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("../../pages/emails/email-template-list-page", () => ({
  __esModule: true,
  default: () => <div data-testid="list-page" />
}));

// Expose the raw param (not a fallback display value) so a route match that
// wrongly captures the literal segment "new" as :template_id is distinguishable
// from a match on the dedicated, param-less creation route.
jest.mock("../../pages/emails/edit-email-template-page", () => ({
  __esModule: true,
  default: ({ match }) => (
    <div
      data-testid="edit-page"
      data-template-id={match.params.template_id ?? ""}
    />
  )
}));

jest.mock("../../pages/emails/email-log-list-page", () => ({
  __esModule: true,
  default: () => <div data-testid="log-page" />
}));

// grants "emails" access so Restrict lets the layout render
const loggedInState = {
  loggedUserState: {
    member: { groups: [{ code: "super-admins" }] }
  }
};

const renderAt = (path) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  return renderWithRedux(
    <Router history={history}>
      <Route path="/app/emails" component={EmailLayout} />
    </Router>,
    { initialState: loggedInState }
  );
};

describe("EmailLayout routing", () => {
  it("renders the list page at /templates", () => {
    renderAt("/app/emails/templates");
    expect(screen.getByTestId("list-page")).toBeInTheDocument();
  });

  it.each([
    ["/app/emails/templates/new", "no trailing slash"],
    [
      "/app/emails/templates/new/",
      "trailing slash — regression guard: must NOT fall through to :template_id=\"new\""
    ]
  ])("renders the editor in create mode at %s (%s)", (path) => {
    renderAt(path);
    // the dedicated creation route has no :template_id param at all
    expect(screen.getByTestId("edit-page")).toHaveAttribute(
      "data-template-id",
      ""
    );
  });

  it("renders the editor with the template_id param at /templates/:template_id", () => {
    renderAt("/app/emails/templates/42");
    expect(screen.getByTestId("edit-page")).toHaveAttribute(
      "data-template-id",
      "42"
    );
  });

  it("does not render the editor for a nested/unknown path under :template_id", () => {
    renderAt("/app/emails/templates/42/extra");
    expect(screen.queryByTestId("edit-page")).not.toBeInTheDocument();
    // falls through to the catch-all redirect -> list page
    expect(screen.getByTestId("list-page")).toBeInTheDocument();
  });

  it("renders the log page at /log", () => {
    renderAt("/app/emails/log");
    expect(screen.getByTestId("log-page")).toBeInTheDocument();
  });
});
