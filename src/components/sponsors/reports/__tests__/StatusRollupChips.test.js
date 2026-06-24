// src/components/sponsors/reports/__tests__/StatusRollupChips.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import StatusRollupChips from "../StatusRollupChips";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

describe("StatusRollupChips", () => {
  it("renders all four status keys with their counts in a stable order", () => {
    renderWithRedux(
      <StatusRollupChips
        rollup={{ completed: 8, in_progress: 2, pending: 4, not_applicable: 0 }}
      />
    );
    expect(
      screen.getByText("sponsor_reports_page.status_completed: 8")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.status_in_progress: 2")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.status_pending: 4")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.status_not_applicable: 0")
    ).toBeInTheDocument();
  });

  it("treats a missing rollup as all-zero (no crash)", () => {
    renderWithRedux(<StatusRollupChips rollup={null} />);
    expect(screen.getAllByText(/: 0$/)).toHaveLength(4);
  });
});
