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
import { getSelectionPlan } from "../../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../../actions/marketing-actions";
import SelectionPlanIdLayout from "../selection-plan-id-layout";

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (k) => k }
}));

// The gate returns null until the fetch resolves and the loaded entity
// matches the URL id, so the breadcrumb's presence signals the gate is open.
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

// Keep the gated subtree trivial so an open gate doesn't drag in the real
// form (which needs a fuller marketing-settings shape than these tests set up).
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
  });
});
