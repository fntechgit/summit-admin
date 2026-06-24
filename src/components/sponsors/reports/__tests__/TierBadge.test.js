// src/components/sponsors/reports/__tests__/TierBadge.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import TierBadge from "../TierBadge";

describe("TierBadge", () => {
  it("renders the tier label uppercased", () => {
    renderWithRedux(<TierBadge tier="Gold" />);
    expect(screen.getByText("GOLD")).toBeInTheDocument();
  });
  it("renders a neutral badge for an unknown tier", () => {
    renderWithRedux(<TierBadge tier="Platinum" />);
    expect(screen.getByText("PLATINUM")).toBeInTheDocument();
  });
  it("renders nothing when tier is null/empty", () => {
    const { container } = renderWithRedux(<TierBadge tier={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
