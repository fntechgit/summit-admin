// src/components/sponsors/reports/__tests__/OrdersTable.test.js
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OrdersTable, { formatCheckoutTime, formatDueDate } from "../OrdersTable";

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

  // ── Offset & malformed contract pins ────────────────────────────────────────
  // The backend always emits UTC `Z` datetimes (sponsor-reports-api TIME_ZONE=
  // "UTC", USE_TZ=True, DRF emits Z), so the offset path is inert in production.
  // These assertions lock the moment.utc() contract so future refactors can't
  // silently change the behavior on non-Z inputs or malformed strings.
  it("converts ISO strings with explicit UTC offsets to UTC before formatting", () => {
    // -05:00 → adds 5 h → 2026-06-30T04:59:59Z
    expect(formatCheckoutTime("2026-06-29T23:59:59-05:00")).toBe(
      "2026-06-30 4:59 AM"
    );
    // +05:00 → subtracts 5 h → 2026-06-29T18:59:59Z
    expect(formatCheckoutTime("2026-06-29T23:59:59+05:00")).toBe(
      "2026-06-29 6:59 PM"
    );
    // Z suffix (the real-data path) — baseline assertion alongside offset cases
    expect(formatCheckoutTime("2026-06-29T23:59:59Z")).toBe(
      "2026-06-29 11:59 PM"
    );
  });

  it("falls back to the 10-char date slice for malformed ISO-like strings", () => {
    // month 13 / day 99 / hour 25 → moment marks invalid → date-only fallback
    expect(formatCheckoutTime("2026-13-99T25:99:00Z")).toBe("2026-13-99");
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
  invoice_total: 25000,
  payment_method: "Invoice",
  invoice_reference: "INV-2026-007",
  invoice_sub_status: "Sent",
  invoice_due_date: 1780674073, // 2026-06-05T15:41:13Z → date part "2026-06-05"
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

  it("renders currencyAmountFromCents(invoice_total) in the Invoice Total column", () => {
    renderTable();
    // 25000 cents → "$250.00" (no thousands separator — platform-wide uicore behavior)
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
    expect(
      sortLabelTexts.some((t) => t.includes("sponsor_reports_page.col_order"))
    ).toBe(true);
    expect(
      sortLabelTexts.some((t) => t.includes("sponsor_reports_page.col_sponsor"))
    ).toBe(true);
    expect(
      sortLabelTexts.some((t) =>
        t.includes("sponsor_reports_page.col_checkout_time")
      )
    ).toBe(true);
    expect(
      sortLabelTexts.some((t) =>
        t.includes("sponsor_reports_page.col_invoice_total")
      )
    ).toBe(true);
    // Non-sortable columns are NOT in sort labels
    expect(
      sortLabelTexts.some((t) => t.includes("sponsor_reports_page.col_type"))
    ).toBe(false);
    expect(
      sortLabelTexts.some((t) =>
        t.includes("sponsor_reports_page.col_sponsor_note")
      )
    ).toBe(false);
  });

  it("clicking a sortable column header calls onSort with (columnKey, dir)", () => {
    const handleSort = jest.fn();
    renderTable([sampleRow], { onSort: handleSort });
    // TableSortLabel for "Order #" has onClick → calls onSort("number", dir)
    fireEvent.click(screen.getByText("sponsor_reports_page.col_order"));
    expect(handleSort).toHaveBeenCalledWith("number", expect.any(Number));
  });

  it("clicking non-sortable Type or Sponsor Note header does NOT call onSort", () => {
    const handleSort = jest.fn();
    renderTable([sampleRow], { onSort: handleSort });
    fireEvent.click(screen.getByText("sponsor_reports_page.col_type"));
    fireEvent.click(screen.getByText("sponsor_reports_page.col_sponsor_note"));
    expect(handleSort).not.toHaveBeenCalled();
  });
});

describe("formatDueDate", () => {
  it("formats an epoch as a UTC date (date-only, timezone-stable)", () => {
    // 2026-06-05T15:41:13Z = 1780674073 s → date part only
    expect(formatDueDate(1780674073)).toBe("2026-06-05");
    expect(formatDueDate("1780674073")).toBe("2026-06-05");
  });

  it("returns an empty string for null/empty/undefined", () => {
    expect(formatDueDate(null)).toBe("");
    expect(formatDueDate(undefined)).toBe("");
    expect(formatDueDate("")).toBe("");
  });
});

describe("OrdersTable finance columns", () => {
  it("renders payment_method, invoice_reference, and invoice_sub_status", () => {
    renderTable();
    expect(screen.getByText("Invoice")).toBeInTheDocument();
    expect(screen.getByText("INV-2026-007")).toBeInTheDocument();
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("renders invoice_due_date as a UTC date via formatDueDate", () => {
    renderTable();
    expect(screen.getByText("2026-06-05")).toBeInTheDocument();
  });

  it("renders an em dash for null finance fields", () => {
    const nullRow = {
      ...sampleRow,
      payment_method: null,
      invoice_reference: null,
      invoice_sub_status: null,
      invoice_due_date: null
    };
    renderTable([nullRow]);
    // invoice_total (25000) still renders $250.00; the four finance cells render —.
    // At least four em-dash cells appear (one per null finance column).
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("finance columns are NOT sortable (no backend ordering field)", () => {
    renderTable();
    const sortLabelTexts = Array.from(
      document.querySelectorAll(".MuiTableSortLabel-root")
    ).map((el) => el.textContent.trim());
    expect(
      sortLabelTexts.some((t) =>
        t.includes("sponsor_reports_page.col_payment_method")
      )
    ).toBe(false);
    expect(
      sortLabelTexts.some((t) =>
        t.includes("sponsor_reports_page.col_invoice_due_date")
      )
    ).toBe(false);
  });
});
