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
import { Router, Route, Switch } from "react-router-dom";
import { createMemoryHistory } from "history";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../utils/test-utils";
import { getSelectionPlan } from "../../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../../actions/marketing-actions";
import SelectionPlanIdLayout from "../selection-plan-id-layout";

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (k) => k }
}));

// The gate renders null until it's open, so the breadcrumb's presence is our signal.
jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => <div data-testid="breadcrumb" />
}));

jest.mock("../../actions/selection-plan-actions", () => ({
  __esModule: true,
  ...jest.requireActual("../../actions/selection-plan-actions"),
  getSelectionPlan: jest.fn(),
  resetSelectionPlanForm: jest.fn(() => ({ type: "RESET_SELECTION_PLAN_FORM" }))
}));

jest.mock("../../actions/marketing-actions", () => ({
  __esModule: true,
  ...jest.requireActual("../../actions/marketing-actions"),
  getMarketingSettingsBySelectionPlan: jest.fn()
}));

// Stub the page: the real form needs a fuller marketing-settings shape than set up here.
jest.mock("../../pages/selection-plans/edit-selection-plan-page", () => ({
  __esModule: true,
  default: () => <div data-testid="edit-selection-plan-page" />
}));

const renderAt = (path, currentSelectionPlan) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  return renderWithRedux(
    <Router history={history}>
      <Route
        path="/app/summits/:summit_id/selection-plans/:selection_plan_id"
        component={SelectionPlanIdLayout}
      />
    </Router>,
    {
      initialState: {
        currentSelectionPlanState: { entity: currentSelectionPlan },
        currentSummitState: { currentSummit: { id: 1 } }
      }
    }
  );
};

const settle = () => act(async () => flushPromises());

const gateOpen = () => screen.queryByTestId("breadcrumb") !== null;

// Mirrors the sibling /new and /:id(\d+) routes in selection-plan-layout.js.
const NewOrEditHarness = ({ history }) => (
  <Router history={history}>
    <Switch>
      <Route
        strict
        exact
        path="/app/summits/:summit_id/selection-plans/new"
        component={SelectionPlanIdLayout}
      />
      <Route
        path="/app/summits/:summit_id/selection-plans/:selection_plan_id(\d+)"
        component={SelectionPlanIdLayout}
      />
    </Switch>
  </Router>
);

describe("SelectionPlanIdLayout selection-plan gate", () => {
  beforeEach(() => {
    getSelectionPlan.mockReset();
    getMarketingSettingsBySelectionPlan.mockReset();
    getSelectionPlan.mockImplementation(() => () => Promise.resolve());
    getMarketingSettingsBySelectionPlan.mockImplementation(
      () => () => Promise.resolve()
    );
  });

  it("stays closed on direct load until the matching plan finishes fetching", async () => {
    getSelectionPlan.mockImplementation(() => () => new Promise(() => {}));
    renderAt("/app/summits/1/selection-plans/5", { id: 5 });
    expect(gateOpen()).toBe(false);
  });

  it("closes when switching to a different plan id until the store catches up", async () => {
    const history = createMemoryHistory({
      initialEntries: ["/app/summits/1/selection-plans/5"]
    });
    renderWithRedux(
      <Router history={history}>
        <Route
          path="/app/summits/:summit_id/selection-plans/:selection_plan_id"
          component={SelectionPlanIdLayout}
        />
      </Router>,
      {
        initialState: {
          currentSelectionPlanState: { entity: { id: 5 } },
          currentSummitState: { currentSummit: { id: 1 } }
        }
      }
    );
    await settle();
    expect(gateOpen()).toBe(true);

    act(() => {
      history.push("/app/summits/1/selection-plans/8");
    });
    expect(gateOpen()).toBe(false);
    expect(getSelectionPlan).toHaveBeenCalledWith("8");

    // Fetch settles, but the store's entity.id is still "5" — must stay closed.
    await settle();
    expect(gateOpen()).toBe(false);
  });

  it("closes when navigating from an existing plan to /new until the store reflects the reset", async () => {
    const history = createMemoryHistory({
      initialEntries: ["/app/summits/1/selection-plans/5"]
    });
    renderWithRedux(<NewOrEditHarness history={history} />, {
      initialState: {
        currentSelectionPlanState: { entity: { id: 5 } },
        currentSummitState: { currentSummit: { id: 1 } }
      }
    });
    await settle();
    expect(gateOpen()).toBe(true);

    // Store still holds plan 5's entity (reset hasn't landed) — gate must close.
    act(() => {
      history.push("/app/summits/1/selection-plans/new");
    });
    expect(gateOpen()).toBe(false);
  });

  it("opens on /new once the store reflects the reset (default) entity", async () => {
    const history = createMemoryHistory({
      initialEntries: ["/app/summits/1/selection-plans/new"]
    });
    renderWithRedux(<NewOrEditHarness history={history} />, {
      initialState: {
        currentSelectionPlanState: { entity: { id: 0 } },
        currentSummitState: { currentSummit: { id: 1 } }
      }
    });
    await settle();
    expect(gateOpen()).toBe(true);
  });
});
