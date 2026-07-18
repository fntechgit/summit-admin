// src/components/sponsors/reports/__tests__/OrdersTable.test.js
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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
      invoice_due_date: null
    };
    renderTable([nullRow]);
    // invoice_total (25000) still renders $250.00; the four finance cells render —.
    // Exactly four em-dash cells appear (one per null finance column).
    expect(screen.getAllByText("—")).toHaveLength(4);
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
});
