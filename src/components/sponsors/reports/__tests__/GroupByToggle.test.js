// src/components/sponsors/reports/__tests__/GroupByToggle.test.js
import "@testing-library/jest-dom";
import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import GroupByToggle from "../GroupByToggle";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

describe("GroupByToggle", () => {
  it("shows the active value and calls onChange with the other value", () => {
    const onChange = jest.fn();
    renderWithRedux(<GroupByToggle value="sponsor" onChange={onChange} />);
    fireEvent.click(
      screen.getByText("sponsor_reports_page.group_by_component")
    );
    expect(onChange).toHaveBeenCalledWith("component");
  });

  it("ignores a null toggle (clicking the already-active button) — never clears", () => {
    const onChange = jest.fn();
    renderWithRedux(<GroupByToggle value="sponsor" onChange={onChange} />);
    fireEvent.click(screen.getByText("sponsor_reports_page.group_by_sponsor"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
