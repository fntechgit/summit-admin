// src/components/sponsors/reports/__tests__/ReportShell.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import ReportShell from "../ReportShell";

describe("ReportShell", () => {
  it("renders title, subtitle, actions, filterBar and children", () => {
    renderWithRedux(
      <ReportShell
        title="My Title"
        subtitle="My Subtitle"
        actions={<button type="button">Act</button>}
        filterBar={<div>FilterSlot</div>}
      >
        <div>Body</div>
      </ReportShell>
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My Subtitle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Act" })).toBeInTheDocument();
    expect(screen.getByText("FilterSlot")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders an icon node when provided", () => {
    renderWithRedux(
      <ReportShell title="T" icon={<span data-testid="hdr-icon">i</span>} />
    );
    expect(screen.getByTestId("hdr-icon")).toBeInTheDocument();
  });
});
