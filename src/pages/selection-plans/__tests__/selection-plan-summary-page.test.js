import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import SelectionPlanSummaryPage from "../selection-plan-summary-page";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const buildState = (entity) => ({
  currentSummitState: {
    currentSummit: { id: 1, time_zone_id: "America/Chicago" }
  },
  currentSelectionPlanState: { entity }
});

describe("SelectionPlanSummaryPage", () => {
  const history = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to the edit page on edit", async () => {
    renderWithRedux(<SelectionPlanSummaryPage history={history} />, {
      initialState: buildState({ id: 5, name: "CFP 2026" })
    });

    await userEvent.click(screen.getByRole("button", { name: "general.edit" }));

    expect(history.push).toHaveBeenCalledWith(
      "/app/summits/1/selection-plans/5/edit"
    );
  });

  it("shows n/a for unset dates and empty linked items", () => {
    // reducer normalizes null fields to ""
    renderWithRedux(<SelectionPlanSummaryPage history={history} />, {
      initialState: buildState({
        id: 5,
        name: "CFP 2026",
        submission_begin_date: 0,
        voting_begin_date: "",
        track_groups: "",
        event_types: [{ id: 1, name: "Keynote" }],
        allowed_presentation_action_types: [{ id: 2, label: "Reviewed" }]
      })
    });

    expect(screen.getByText("Keynote")).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    // 7 unset dates + 3 empty linked lists
    expect(screen.getAllByText("general.n_a")).toHaveLength(10);
  });
});
