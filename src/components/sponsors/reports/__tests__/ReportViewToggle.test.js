import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ReportViewToggle from "../ReportViewToggle";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

describe("ReportViewToggle", () => {
  it("emits the clicked view but ignores a re-click of the active button (MUI passes null)", () => {
    const onChange = jest.fn();
    render(<ReportViewToggle value="orders" onChange={onChange} />);
    // Clicking the inactive view emits its key.
    fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    expect(onChange).toHaveBeenCalledWith("lines");
    onChange.mockClear();
    // Re-clicking the active view → MUI passes null → we swallow it.
    fireEvent.click(screen.getByText("sponsor_reports_page.view_orders"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
