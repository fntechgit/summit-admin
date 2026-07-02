// src/components/sponsors/reports/__tests__/SummaryPanel.test.js
import "@testing-library/jest-dom";
import React from "react";
import { renderWithRedux } from "utils/test-utils";
import SummaryPanel from "../SummaryPanel";

describe("SummaryPanel", () => {
  it("renders nothing for an empty tile list", () => {
    const { container } = renderWithRedux(<SummaryPanel tiles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
