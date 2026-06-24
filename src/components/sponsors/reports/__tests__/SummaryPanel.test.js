// src/components/sponsors/reports/__tests__/SummaryPanel.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import SummaryPanel from "../SummaryPanel";

describe("SummaryPanel", () => {
  it("renders tiles with label and value", () => {
    renderWithRedux(
      <SummaryPanel
        tiles={[
          { key: "a", label: "Paid", value: "$10.00", tone: "success" },
          { key: "b", label: "Orders", value: 5 }
        ]}
      />
    );
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders nothing for an empty tile list", () => {
    const { container } = renderWithRedux(<SummaryPanel tiles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
