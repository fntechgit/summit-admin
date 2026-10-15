import React from "react";
import { screen } from "@testing-library/react";
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
  it("shows n/a for empty linked items and renders the disclaimer", () => {
    // reducer normalizes null fields to ""
    renderWithRedux(<SelectionPlanSummaryPage />, {
      initialState: buildState({
        id: 5,
        name: "CFP 2026",
        track_groups: "",
        event_types: [{ id: 1, name: "Keynote" }],
        allowed_presentation_action_types: [{ id: 2, label: "Reviewed" }],
        submission_period_disclaimer: "<p>Read the <b>rules</b></p>"
      })
    });

    expect(screen.getByText("Keynote")).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    // track groups, extra questions, rating types
    expect(screen.getAllByText("general.n_a")).toHaveLength(3);
    expect(screen.getByText("rules")).toBeInTheDocument();
  });
});
