import "@testing-library/jest-dom";
import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PivotSelector from "../PivotSelector";

// Mock i18n so T.translate returns the key — the combobox accessible name asserted below
// is "sponsor_reports_page.group_by" (matches sibling report-component tests).
jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

// MUI v6 Select exposes role="combobox" (labelled by the InputLabel) and role="option"
// for menu items — mirrors src/pages/.../sponsor-purchases-list.test.js:428-438.
it("renders all pivots and emits the selected key", async () => {
  const onChange = jest.fn();
  render(<PivotSelector value="component_sponsor" onChange={onChange} />);
  await act(async () => {
    await userEvent.click(
      screen.getByRole("combobox", { name: "sponsor_reports_page.group_by" })
    );
  });
  await act(async () => {
    await userEvent.click(
      screen.getByRole("option", {
        name: "sponsor_reports_page.pivot_page_sponsor_component"
      })
    );
  });
  expect(onChange).toHaveBeenCalledWith("page_sponsor_component");
});
