import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LinesManifestView from "../LinesManifestView";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k, opts) =>
    opts && opts.count != null ? `${k}:${opts.count}` : k
}));

const line = (over = {}) => ({
  sponsor: { id: 17, name: "Acme" },
  purchase: {
    id: 5001,
    number: "OCP-1",
    status: "Paid",
    checkout_at: 1735000000
  },
  form: { code: "AV", name: "Audio Visual" },
  item_code: "AV1",
  description: "Audio mixer",
  rate_name: "Early",
  quantity: 2,
  unit_price: "500.00",
  line_total: "1000.00",
  add_on_id: 3,
  add_on_name: "Meeting Room T",
  notes: "dock B",
  is_canceled: false,
  canceled_at: null,
  ...over
});

const renderView = (props = {}) =>
  render(
    <LinesManifestView
      rows={[line()]}
      total={1}
      currentPage={1}
      perPage={50}
      onPageChange={jest.fn()}
      onPerPageChange={jest.fn()}
      {...props}
    />
  );

describe("LinesManifestView", () => {
  it("renders a sponsor section header with a lines count", () => {
    renderView();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.lines_count:1")
    ).toBeInTheDocument();
  });

  it("renders the line's destination from add_on_name", () => {
    renderView();
    expect(screen.getByText("Meeting Room T")).toBeInTheDocument();
  });

  it("falls back to a muted 'Booth' when add_on_name is null", () => {
    renderView({ rows: [line({ add_on_name: null })] });
    expect(
      screen.getByText("sponsor_reports_page.destination_booth_fallback")
    ).toBeInTheDocument();
  });

  it("renders the status pill and money/qty cells", () => {
    renderView();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("AV1")).toBeInTheDocument();
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
  });

  it("KEEPS a canceled line in the rendered set (visual treatment, not filtered)", () => {
    renderView({
      rows: [
        line({ item_code: "AV2", is_canceled: true, canceled_at: 1735100000 })
      ]
    });
    expect(screen.getByText("AV2")).toBeInTheDocument();
    const row = screen.getByText("AV2").closest("tr");
    expect(row).toHaveAttribute("data-canceled", "true");
  });

  it("calls onPageChange with a 1-indexed page when the pager advances", () => {
    const onPageChange = jest.fn();
    renderView({ total: 120, onPageChange });
    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
