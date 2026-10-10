import React from "react";
import { act, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../utils/test-utils";
import SelectionPlanIdLayout from "../selection-plan-id-layout";
import { getSelectionPlan } from "../../actions/selection-plan-actions";
import { getMarketingSettingsBySelectionPlan } from "../../actions/marketing-actions";

jest.mock("i18n-react", () => ({ translate: (k) => k }));

jest.mock("react-breadcrumbs", () => ({ Breadcrumb: () => null }));

jest.mock("../../actions/selection-plan-actions", () => ({
  getSelectionPlan: jest.fn(),
  resetSelectionPlanForm: jest.fn(() => ({ type: "RESET_SELECTION_PLAN_FORM" }))
}));

jest.mock("../../actions/marketing-actions", () => ({
  getMarketingSettingsBySelectionPlan: jest.fn()
}));

jest.mock("../../pages/selection-plans/edit-selection-plan-page", () => ({
  __esModule: true,
  default: () => <div data-testid="edit-selection-plan" />
}));

const initialState = {
  currentSummitState: { currentSummit: { id: 1 } },
  currentSelectionPlanState: { entity: { id: 0, name: "" } }
};

describe("SelectionPlanIdLayout", () => {
  it("renders the edit page only after the marketing settings load", async () => {
    let resolveMarketingSettings;
    getSelectionPlan.mockReturnValue(() => Promise.resolve());
    getMarketingSettingsBySelectionPlan.mockReturnValue(
      () =>
        new Promise((resolve) => {
          resolveMarketingSettings = resolve;
        })
    );

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
      { initialState }
    );

    await act(async () => {
      await flushPromises();
    });
    expect(screen.queryByTestId("edit-selection-plan")).not.toBeInTheDocument();

    await act(async () => {
      resolveMarketingSettings();
      await flushPromises();
    });
    expect(
      await screen.findByTestId("edit-selection-plan")
    ).toBeInTheDocument();
  });
});
