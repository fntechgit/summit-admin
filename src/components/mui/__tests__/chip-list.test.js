// chip-list.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChipList from "../chip-list";

// Mock MUI Tooltip because it uses portals which are hard to test
jest.mock("@mui/material/Tooltip", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, title }) => (
      <div
        data-testid="tooltip"
        data-title={Array.isArray(title) ? title.length : title}
      >
        {children}
      </div>
    )
  };
});

describe("ChipList", () => {
  test("renders all chips when below maxLength", () => {
    const chips = ["React", "Jest", "JavaScript"];
    const maxLength = 5;

    render(<ChipList chips={chips} maxLength={maxLength} />);

    chips.forEach((chip) => {
      expect(screen.getByText(chip)).toBeInTheDocument();
    });
    expect(screen.queryByText("...")).not.toBeInTheDocument();
  });

  test("renders maxLength chips and ellipsis when chips exceed maxLength", () => {
    const chips = ["React", "Jest", "JavaScript", "TypeScript", "HTML", "CSS"];
    const maxLength = 3;

    render(<ChipList chips={chips} maxLength={maxLength} />);

    // First 3 should be visible
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Jest")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();

    // Rest should not be directly visible
    expect(screen.queryByText("TypeScript")).not.toBeInTheDocument();
    expect(screen.queryByText("HTML")).not.toBeInTheDocument();
    expect(screen.queryByText("CSS")).not.toBeInTheDocument();

    // Ellipsis chip should be present
    expect(screen.getByText("...")).toBeInTheDocument();
  });

  test("tooltip contains remaining chips when some are hidden", () => {
    const chips = ["React", "Jest", "JavaScript", "TypeScript", "HTML", "CSS"];
    const maxLength = 3;

    render(<ChipList chips={chips} maxLength={maxLength} />);

    const tooltip = screen.getByTestId("tooltip");
    // Check if tooltip contains 3 items (remaining chips)
    expect(tooltip).toHaveAttribute("data-title", "3");
    expect(tooltip).toContainElement(screen.getByText("..."));
  });

  test("renders empty box when no chips are provided", () => {
    render(<ChipList chips={[]} maxLength={5} />);

    // Box should be empty, no chips or ellipsis
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
