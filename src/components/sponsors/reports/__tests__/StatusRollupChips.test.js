// src/components/sponsors/reports/__tests__/StatusRollupChips.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import StatusRollupChips from "../StatusRollupChips";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

describe("StatusRollupChips", () => {
  it("renders the three displayed status keys with their counts in a stable order", () => {
    renderWithRedux(
      <StatusRollupChips
        rollup={{ completed: 8, in_progress: 2, pending: 4, not_applicable: 0 }}
      />
    );
    // Chips render via uicore chip-list as plain MUI Chips; each label is the
    // "status: count" string. Assert all three in their fixed display order.
    const chipLabels = screen
      .getAllByText(/sponsor_reports_page\.status_/)
      .map((el) => el.textContent);
    expect(chipLabels).toEqual([
      "sponsor_reports_page.status_completed: 8",
      "sponsor_reports_page.status_in_progress: 2",
      "sponsor_reports_page.status_pending: 4"
    ]);
    // N/A is not a sponsor-asset state (report is scoped to Media); never displayed.
    expect(screen.queryByText(/status_not_applicable/)).not.toBeInTheDocument();
  });
});
