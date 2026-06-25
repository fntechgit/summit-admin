// src/components/sponsors/reports/__tests__/OrdersTable.test.js
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OrdersTable, { formatCheckoutTime, toOrderParam } from "../OrdersTable";

// MuiTable uses i18n-react internally (no-items message, pagination labels).
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k) => k
}));

// ────────────────────────────────────────────────────────────────────────────
// formatCheckoutTime — port of OrdersGrid.js helper (timezone-stable UTC parsing)
// ────────────────────────────────────────────────────────────────────────────
describe("formatCheckoutTime", () => {
  it("formats an ISO datetime as 'YYYY-MM-DD h:mm AM/PM' (12-hour, timezone-stable)", () => {
    expect(formatCheckoutTime("2026-06-05T15:41:13.13489Z")).toBe(
      "2026-06-05 3:41 PM"
    );
    expect(formatCheckoutTime("2026-06-05T09:05:00Z")).toBe(
      "2026-06-05 9:05 AM"
    );
    expect(formatCheckoutTime("2026-06-05T00:00:00Z")).toBe(
      "2026-06-05 12:00 AM"
    );
    expect(formatCheckoutTime("2026-06-05T12:00:00Z")).toBe(
      "2026-06-05 12:00 PM"
    );
  });

  it("formats an epoch (number or all-digit string) as UTC date+time", () => {
    // 2026-06-05T15:41:13Z = 1780674073 s
    expect(formatCheckoutTime(1780674073)).toBe("2026-06-05 3:41 PM");
    expect(formatCheckoutTime("1780674073")).toBe("2026-06-05 3:41 PM");
  });

  it("falls back to the date part when there is no time component", () => {
    expect(formatCheckoutTime("2026-01-01")).toBe("2026-01-01");
  });

  it("returns an empty string for null/empty/undefined", () => {
    expect(formatCheckoutTime(null)).toBe("");
    expect(formatCheckoutTime(undefined)).toBe("");
    expect(formatCheckoutTime("")).toBe("");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// sort-key helpers
// ────────────────────────────────────────────────────────────────────────────
describe("OrdersTable sort helpers", () => {
  it("toOrderParam encodes asc (dir=1) and desc (dir=-1)", () => {
    expect(toOrderParam("number", 1)).toBe("number");
    expect(toOrderParam("number", -1)).toBe("-number");
    expect(toOrderParam("order_date", -1)).toBe("-order_date");
    expect(toOrderParam("invoice_total", 1)).toBe("invoice_total");
  });

  it("toOrderParam returns undefined when columnKey is falsy", () => {
    expect(toOrderParam(null, 1)).toBeUndefined();
    expect(toOrderParam(undefined, 1)).toBeUndefined();
    expect(toOrderParam("", 1)).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// OrdersTable rendering
// ────────────────────────────────────────────────────────────────────────────

const sampleRow = {
  purchase_id: 7,
  purchase_number: "ORD-007",
  sponsor: { name: "Acme Corp" },
  checkout_at: "2026-06-05T15:41:13Z",
  form: { display: "Booth" },
  status: "Paid",
  invoice_total: "250.00",
  sponsor_note: "VIP note"
};

function renderTable(rows = [sampleRow], extraProps = {}) {
  return render(
    <OrdersTable
      rows={rows}
      totalRows={rows.length}
      currentPage={1}
      perPage={10}
      order={null}
      orderDir={1}
      onPageChange={() => {}}
      onPerPageChange={() => {}}
      onSort={() => {}}
      {...extraProps}
    />
  );
}

describe("OrdersTable rendering", () => {
  it("maps purchase_id → id so MuiTable can key rows without crashing", () => {
    const { container } = renderTable();
    // If id mapping works, MuiTable renders at least one data row
    expect(container.querySelector("tbody tr")).toBeTruthy();
  });

  it("renders purchase_number in the Order # column", () => {
    renderTable();
    expect(screen.getByText("ORD-007")).toBeInTheDocument();
  });

  it("renders sponsor.name in the Sponsor column", () => {
    renderTable();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders formatCheckoutTime(checkout_at) in the Checkout Time column", () => {
    renderTable();
    // "2026-06-05T15:41:13Z" → "2026-06-05 3:41 PM"
    expect(screen.getByText("2026-06-05 3:41 PM")).toBeInTheDocument();
  });

  it("renders form.display in the Type column", () => {
    renderTable();
    expect(screen.getByText("Booth")).toBeInTheDocument();
  });

  it("renders a StatusPill chip for the status column", () => {
    renderTable();
    // StatusPill renders a MUI Chip; the label is the status value
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("renders formatUsd(invoice_total) in the Invoice Total column", () => {
    renderTable();
    expect(screen.getByText("$250.00")).toBeInTheDocument();
  });

  it("renders the sponsor_note column", () => {
    renderTable();
    expect(screen.getByText("VIP note")).toBeInTheDocument();
  });

  it("renders epoch checkout_at correctly (timezone-stable)", () => {
    const epochRow = { ...sampleRow, checkout_at: 1780674073 };
    renderTable([epochRow]);
    expect(screen.getByText("2026-06-05 3:41 PM")).toBeInTheDocument();
  });

  it("sortable columns (Order #, Sponsor, etc.) render MuiTableSortLabel; Type and Sponsor Note do not", () => {
    renderTable();
    // MuiTable renders a .MuiTableSortLabel-root span for each sortable column
    const sortLabels = Array.from(
      document.querySelectorAll(".MuiTableSortLabel-root")
    );
    const sortLabelTexts = sortLabels.map((el) => el.textContent.trim());

    // Sortable columns are wrapped in sort labels
    expect(sortLabelTexts.some((t) => t.includes("Order #"))).toBe(true);
    expect(sortLabelTexts.some((t) => t.includes("Sponsor"))).toBe(true);
    expect(sortLabelTexts.some((t) => t.includes("Checkout Time"))).toBe(true);
    expect(sortLabelTexts.some((t) => t.includes("Invoice Total"))).toBe(true);
    // Non-sortable columns are NOT in sort labels
    expect(sortLabelTexts.some((t) => t.includes("Type"))).toBe(false);
    expect(sortLabelTexts.some((t) => t.includes("Sponsor Note"))).toBe(false);
  });

  it("clicking a sortable column header calls onSort with (columnKey, dir)", () => {
    const handleSort = jest.fn();
    renderTable([sampleRow], { onSort: handleSort });
    // TableSortLabel for "Order #" has onClick → calls onSort("number", dir)
    fireEvent.click(screen.getByText("Order #"));
    expect(handleSort).toHaveBeenCalledWith("number", expect.any(Number));
  });

  it("clicking non-sortable Type or Sponsor Note header does NOT call onSort", () => {
    const handleSort = jest.fn();
    renderTable([sampleRow], { onSort: handleSort });
    fireEvent.click(screen.getByText("Type"));
    fireEvent.click(screen.getByText("Sponsor Note"));
    expect(handleSort).not.toHaveBeenCalled();
  });
});
