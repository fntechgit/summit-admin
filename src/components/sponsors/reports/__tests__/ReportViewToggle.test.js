import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ReportViewToggle from "../ReportViewToggle";

jest.mock("i18n-react/dist/i18n-react", () => ({ translate: (k) => k }));

describe("ReportViewToggle", () => {
  it("renders both view options", () => {
    render(<ReportViewToggle value="orders" onChange={jest.fn()} />);
    expect(
      screen.getByText("sponsor_reports_page.view_orders")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.view_line_items")
    ).toBeInTheDocument();
  });

  it("calls onChange with the clicked view", () => {
    const onChange = jest.fn();
    render(<ReportViewToggle value="orders" onChange={onChange} />);
    fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    expect(onChange).toHaveBeenCalledWith("lines");
  });

  it("ignores a re-click of the active button (MUI passes null)", () => {
    const onChange = jest.fn();
    render(<ReportViewToggle value="orders" onChange={onChange} />);
    fireEvent.click(screen.getByText("sponsor_reports_page.view_orders"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
