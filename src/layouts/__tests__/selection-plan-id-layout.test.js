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
import { act } from "@testing-library/react";
import { Router, Route, Switch } from "react-router-dom";
import { createMemoryHistory } from "history";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../utils/test-utils";
import {
  getSelectionPlan,
  resetSelectionPlanForm
} from "../../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../../actions/marketing-actions";
import SelectionPlanIdLayout from "../selection-plan-id-layout";

jest.mock("i18n-react", () => ({ translate: (k) => k }));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => <div data-testid="breadcrumb" />
}));

jest.mock("../../actions/selection-plan-actions", () => ({
  getSelectionPlan: jest.fn(),
  resetSelectionPlanForm: jest.fn()
}));

jest.mock("../../actions/marketing-actions", () => ({
  getMarketingSettingsBySelectionPlan: jest.fn()
}));

jest.mock("../../pages/selection-plans/edit-selection-plan-page", () => ({
  __esModule: true,
  default: () => <div data-testid="edit-page" />
}));

const SUMMIT_ID = 1;
const PLAN_A = "5";

const renderAt = (path) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  const utils = renderWithRedux(
    <Router history={history}>
      <Switch>
        <Route
          exact
          path="/app/summits/:summit_id/selection-plans/new"
          component={SelectionPlanIdLayout}
        />
        <Route
          path="/app/summits/:summit_id/selection-plans/:selection_plan_id(\d+)"
          component={SelectionPlanIdLayout}
        />
      </Switch>
    </Router>,
    {
      initialState: {
        currentSummitState: { currentSummit: { id: SUMMIT_ID } },
        currentSelectionPlanState: { entity: { id: 0 } }
      }
    }
  );
  return { ...utils, history };
};

describe("SelectionPlanIdLayout - superseded load", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetSelectionPlanForm.mockImplementation(() => () => {});
    getMarketingSettingsBySelectionPlan.mockImplementation(
      () => () => Promise.resolve()
    );
  });

  it("does not fetch plan A's settings once the user has moved on to /new", async () => {
    let resolvePlanA;
    getSelectionPlan.mockImplementation(
      () => () =>
        new Promise((resolve) => {
          resolvePlanA = resolve;
        })
    );

    // Open plan A; its entity fetch is still in flight...
    const { history } = renderAt(
      `/app/summits/${SUMMIT_ID}/selection-plans/${PLAN_A}`
    );
    expect(getSelectionPlan).toHaveBeenCalledWith(PLAN_A);

    // ...when the user goes back and clicks "Add new", which remounts the
    // layout on /new and resets the form.
    act(() => {
      history.push(`/app/summits/${SUMMIT_ID}/selection-plans/new`);
    });
    expect(resetSelectionPlanForm).toHaveBeenCalled();

    // Plan A's (superseded) getSelectionPlan resolves late.
    await act(async () => {
      resolvePlanA();
      await flushPromises();
    });

    expect(getMarketingSettingsBySelectionPlan).not.toHaveBeenCalled();
  });

  it("fetches the plan's settings once its entity has loaded", async () => {
    getSelectionPlan.mockImplementation(() => () => Promise.resolve());

    renderAt(`/app/summits/${SUMMIT_ID}/selection-plans/${PLAN_A}`);
    await act(async () => flushPromises());

    expect(getMarketingSettingsBySelectionPlan).toHaveBeenCalledWith(
      PLAN_A,
      null,
      1,
      expect.any(Number)
    );
  });
});
