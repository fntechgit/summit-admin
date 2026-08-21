// src/components/sponsors/reports/__tests__/OrdersTable.test.js
import "@testing-library/jest-dom";
import React from "react";
import moment from "moment-timezone";
import { render, screen, fireEvent, within } from "@testing-library/react";
import OrdersTable from "../OrdersTable";

// MuiTable uses i18n-react internally (no-items message, pagination labels).
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k) => k
}));

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

  it("clicking a sortable column header calls onSort with (columnKey, dir)", () => {
    const handleSort = jest.fn();
    renderTable([sampleRow], { onSort: handleSort });
    // TableSortLabel for "Order #" has onClick → calls onSort("number", dir)
    fireEvent.click(screen.getByText("sponsor_reports_page.col_order"));
    expect(handleSort).toHaveBeenCalledWith("number", expect.any(Number));
  });
});

describe("OrdersTable finance columns", () => {
  it("renders an em dash for null finance fields", () => {
    const nullRow = {
      ...sampleRow,
      payment_method: null,
      invoice_reference: null,
      invoice_sub_status: null,
      invoice_due_date: null,
      refunded_amount: null
    };
    renderTable([nullRow]);
    // invoice_total (25000) still renders $250.00; the five finance cells render —.
    // Exactly five em-dash cells appear (one per null finance column, now
    // including refunded_amount added in Task 10).
    expect(screen.getAllByText("—")).toHaveLength(5);
  });
});

describe("OrdersTable refund and freshness columns", () => {
  it("surfaces refunded_amount, which never changes purchase status", () => {
    // a refund leaves the order Paid forever; refunded_amount is the only signal
    renderTable([{ ...sampleRow, refunded_amount: 100 }]);
    expect(screen.getByText("$1.00")).toBeInTheDocument();
  });

  it("renders both freshness timestamps, in the row's final two cells", () => {
    // formatCheckoutTime is moment.unix(v).utc().format("YYYY-MM-DD h:mm A").
    // Distinct values (not the same epoch for both fields) so a swap or a
    // missing cell can't hide behind a shared string.
    const synced = 1755561600; // 2025-08-19
    const sourceUpdated = 1755648000; // 2025-08-20
    renderTable([
      { ...sampleRow, synced_at: synced, source_updated_at: sourceUpdated }
    ]);
    const syncedText = moment.unix(synced).utc().format("YYYY-MM-DD h:mm A");
    const sourceUpdatedText = moment
      .unix(sourceUpdated)
      .utc()
      .format("YYYY-MM-DD h:mm A");
    const row = screen.getByText(sampleRow.purchase_number).closest("tr");
    const cells = within(row).getAllByRole("cell");
    expect(cells[cells.length - 2]).toHaveTextContent(syncedText);
    expect(cells[cells.length - 1]).toHaveTextContent(sourceUpdatedText);
  });

  it("appends the new columns without disturbing the existing header order", () => {
    renderTable();
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    // Full 14-key sequence, not just the appended tail — a reorder or swap
    // among the original 11 (e.g. col_order/col_sponsor) must fail this too.
    expect(headers).toEqual([
      "sponsor_reports_page.col_order",
      "sponsor_reports_page.col_sponsor",
      "sponsor_reports_page.col_checkout_time",
      "sponsor_reports_page.col_type",
      "sponsor_reports_page.col_status",
      "sponsor_reports_page.col_invoice_total",
      "sponsor_reports_page.col_payment_method",
      "sponsor_reports_page.col_invoice_reference",
      "sponsor_reports_page.col_invoice_sub_status",
      "sponsor_reports_page.col_invoice_due_date",
      "sponsor_reports_page.col_sponsor_note",
      "sponsor_reports_page.col_refunded",
      "sponsor_reports_page.col_synced_at",
      "sponsor_reports_page.col_source_updated"
    ]);
  });
});

describe("OrdersTable Type column (contained forms)", () => {
  it("renders the full contained form set joined when forms is present", () => {
    renderTable([
      {
        ...sampleRow,
        forms: [
          { code: "CL", name: "Cleaning" },
          { code: "EL", name: "Electrical" }
        ]
      }
    ]);
    expect(
      screen.getByText("CL - Cleaning, EL - Electrical")
    ).toBeInTheDocument();
  });

  it("falls back to form.display when forms is absent (pre-deploy API)", () => {
    renderTable(); // sampleRow has no forms property
    expect(screen.getByText("Booth")).toBeInTheDocument();
  });

  it("falls back to form.display when forms is an empty array", () => {
    renderTable([{ ...sampleRow, forms: [] }]);
    expect(screen.getByText("Booth")).toBeInTheDocument();
  });

  it("renders the bare code when a form name is null (pre-backfill rows)", () => {
    renderTable([{ ...sampleRow, forms: [{ code: "CL", name: null }] }]);
    expect(screen.getByText("CL")).toBeInTheDocument();
  });

  it("renders the bare code when a form name is an empty string", () => {
    renderTable([{ ...sampleRow, forms: [{ code: "CL", name: "" }] }]);
    expect(screen.getByText("CL")).toBeInTheDocument();
  });
});
