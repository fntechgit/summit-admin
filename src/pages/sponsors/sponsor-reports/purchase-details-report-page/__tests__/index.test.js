// src/pages/sponsors/sponsor-reports/purchase-details-report-page/__tests__/index.test.js
import "@testing-library/jest-dom";
import React from "react";
import { act, screen, fireEvent } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import { renderWithRedux } from "utils/test-utils";
import PurchaseDetailsReportPage from "../index";

// Echo i18n keys so T.translate("sponsor_reports_page.foo") → "sponsor_reports_page.foo"
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k) => k
}));

// ── Snackbar hook ─────────────────────────────────────────────────────────────
const mockErrorMessage = jest.fn();
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({
    useSnackbarMessage: () => ({ errorMessage: mockErrorMessage })
  })
);

// Action creators: jest.fn() inside the factory to avoid hoisting issues.
// Import the mocked functions below to assert on .mock.calls.
// Export thunks return a plain object so redux-mock-store does not reject the
// dispatched value (a bare jest.fn() returns undefined which the store rejects).
jest.mock("../../../../../actions/sponsor-reports-actions", () => ({
  getPurchaseDetailsReport: jest.fn(() => ({
    type: "REQUEST_PURCHASE_DETAILS"
  })),
  getPurchaseDetailsFilters: jest.fn(() => ({
    type: "REQUEST_PURCHASE_DETAILS_FILTERS"
  })),
  getPurchaseDetailsLinesReport: jest.fn(() => ({
    type: "REQUEST_PURCHASE_DETAILS_LINES"
  })),
  clearPurchaseDetailsValidation: jest.fn(() => ({
    type: "PURCHASE_DETAILS_VALIDATION_CLEAR"
  })),
  exportPurchaseDetailsCsv: jest.fn(() => ({ type: "EXPORT_PD_CSV" })),
  exportPurchaseDetailsLinesCsv: jest.fn(() => ({
    type: "EXPORT_PD_LINES_CSV"
  })),
  PURCHASE_DETAILS_VALIDATION_CLEAR: "PURCHASE_DETAILS_VALIDATION_CLEAR",
  PURCHASE_DETAILS_READ_ERROR: "PURCHASE_DETAILS_READ_ERROR"
}));

// Access the jest.fn() references from the mock (standard jest pattern).
const {
  getPurchaseDetailsReport,
  getPurchaseDetailsFilters,
  getPurchaseDetailsLinesReport,
  clearPurchaseDetailsValidation,
  exportPurchaseDetailsCsv,
  exportPurchaseDetailsLinesCsv
} = require("../../../../../actions/sponsor-reports-actions");

// ────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ────────────────────────────────────────────────────────────────────────────

const SAMPLE_ROW = {
  purchase_id: 1,
  purchase_number: "ORD-001",
  sponsor: { name: "Acme Corp" },
  checkout_at: "2026-06-05T15:41:13Z",
  form: { display: "Booth" },
  status: "Paid",
  invoice_total: 10000,
  sponsor_note: ""
};

const SAMPLE_LINE = {
  sponsor: { id: 17, name: "Acme Corp" },
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
  unit_price: 50000,
  line_total: 100000,
  add_on_id: 3,
  add_on_name: "Meeting Room T",
  notes: "dock B",
  is_canceled: false,
  canceled_at: null
};

const PAGE_ROUTE = "/app/summits/:summit_id/sponsors/reports/purchase-details";
const PAGE_URL = "/app/summits/42/sponsors/reports/purchase-details";

function buildState(summaryOverrides = {}, { total = 1 } = {}) {
  return {
    sponsorReportsPurchaseDetailsState: {
      data: [SAMPLE_ROW],
      summary: {
        total_orders: 1,
        total_items: 1,
        total_paid: 10000,
        total_pending: 0,
        total_refunded: null,
        ...summaryOverrides
      },
      filterOptions: { sponsors: [], statuses: [], forms: [] },
      total,
      loading: false,
      readError: null,
      validationError: null
    },
    currentSummitState: {
      currentSummit: { id: 42 }
    },
    sponsorReportsPurchaseDetailsLinesState: {
      data: [SAMPLE_LINE],
      summary: {
        total_orders: 1,
        total_items: 2,
        total_paid: 100000,
        total_pending: 0,
        total_refunded: null
      },
      total: 1,
      currentPage: 1,
      lastPage: 1,
      perPage: 50,
      loading: false,
      readError: null
    }
  };
}

function renderPage(summaryOverrides = {}, stateOptions = {}) {
  const history = createMemoryHistory({ initialEntries: [PAGE_URL] });
  return {
    history,
    ...renderWithRedux(
      <Router history={history}>
        <Route path={PAGE_ROUTE} component={PurchaseDetailsReportPage} />
      </Router>,
      { initialState: buildState(summaryOverrides, stateOptions) }
    )
  };
}

/** Render with an explicit validationError in the purchase-details slice. */
function renderPageWithValidationError(validationError) {
  const state = buildState();
  state.sponsorReportsPurchaseDetailsState.validationError = validationError;
  const history = createMemoryHistory({ initialEntries: [PAGE_URL] });
  return renderWithRedux(
    <Router history={history}>
      <Route path={PAGE_ROUTE} component={PurchaseDetailsReportPage} />
    </Router>,
    { initialState: state }
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("PurchaseDetailsReportPage", () => {
  it("dispatches getPurchaseDetailsReport and getPurchaseDetailsFilters on mount", async () => {
    renderPage();
    await act(async () => {});
    expect(getPurchaseDetailsReport).toHaveBeenCalled();
    expect(getPurchaseDetailsFilters).toHaveBeenCalled();
  });

  it("dispatches getPurchaseDetailsReport with page=1 and per_page=10 on initial load", async () => {
    renderPage();
    await act(async () => {});
    expect(getPurchaseDetailsReport).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, per_page: 10 })
    );
  });

  it("renders data rows via OrdersTable (MuiTable)", async () => {
    renderPage();
    await act(async () => {});
    // purchase_number rendered by OrdersTable's "Order #" column
    expect(screen.getByText("ORD-001")).toBeInTheDocument();
    // sponsor.name rendered by Sponsor column
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  it("renders summary tiles for total_orders, total_items, total_paid, total_pending", async () => {
    renderPage();
    await act(async () => {});
    expect(
      screen.getByText("sponsor_reports_page.total_orders")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.total_items")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.total_paid")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sponsor_reports_page.total_pending")
    ).toBeInTheDocument();
  });

  describe("D9 — conditional Total Refunded tile", () => {
    it("hides the Total Refunded tile when summary.total_refunded is null", async () => {
      renderPage({ total_refunded: null });
      await act(async () => {});
      expect(
        screen.queryByText("sponsor_reports_page.total_refunded")
      ).not.toBeInTheDocument();
    });

    it("hides the Total Refunded tile when summary.total_refunded is undefined (key absent)", async () => {
      // Build a summary with no total_refunded key at all
      const { total_refunded: _r, ...noRefund } =
        buildState().sponsorReportsPurchaseDetailsState.summary;
      renderPage(noRefund);
      await act(async () => {});
      expect(
        screen.queryByText("sponsor_reports_page.total_refunded")
      ).not.toBeInTheDocument();
    });

    it("shows the Total Refunded tile when summary.total_refunded is a non-null value", async () => {
      renderPage({ total_refunded: 5000 });
      await act(async () => {});
      expect(
        screen.getByText("sponsor_reports_page.total_refunded")
      ).toBeInTheDocument();
    });

    it("shows the Total Refunded tile when summary.total_refunded is 0 (presence check, not truthiness)", async () => {
      renderPage({ total_refunded: 0 });
      await act(async () => {});
      expect(
        screen.getByText("sponsor_reports_page.total_refunded")
      ).toBeInTheDocument();
    });
  });

  it("renders the page title from i18n", async () => {
    renderPage();
    await act(async () => {});
    expect(
      screen.getByText("sponsor_reports_page.purchase_details_title")
    ).toBeInTheDocument();
  });

  it("renders the export button", async () => {
    renderPage();
    await act(async () => {});
    // The export button renders text from T.translate("sponsor_reports_page.export_csv")
    // With the echo mock this becomes the key string
    expect(
      screen.getByText("sponsor_reports_page.export_csv")
    ).toBeInTheDocument();
  });

  it("renders the Print button", async () => {
    renderPage();
    await act(async () => {});
    expect(screen.getByText("sponsor_reports_page.print")).toBeInTheDocument();
  });

  it("dispatches getPurchaseDetailsReport again when a filter changes and Apply is clicked", async () => {
    renderPage();
    await act(async () => {});
    getPurchaseDetailsReport.mockClear();

    // Set the "From date" filter to a non-empty value so the query memo changes.
    // FilterBar renders date inputs with type="date"; the first one is "From date".
    const dateInputs = document.querySelectorAll("input[type=\"date\"]");
    await act(async () => {
      // Trigger the onChange handler which calls update({ dateFrom: "2026-01-01" })
      fireEvent.change(dateInputs[0], { target: { value: "2026-01-01" } });
    });

    // Click Apply to commit the draft filter to page state
    const applyBtn = screen.getByText("sponsor_reports_page.apply");
    await act(async () => {
      fireEvent.click(applyBtn);
    });

    // Filter change → query memo invalidated → useEffect re-fires → re-fetch
    expect(getPurchaseDetailsReport).toHaveBeenCalled();
    const [[calledQuery]] = getPurchaseDetailsReport.mock.calls;
    // Date filter is expanded to ISO and placed in filter[]
    expect(calledQuery["filter[]"]).toEqual(
      expect.arrayContaining([expect.stringContaining("order_date>=")])
    );
    expect(calledQuery).toMatchObject({ page: 1 });
  });

  it("CSV export button calls exportPurchaseDetailsCsv with current filters and sort", async () => {
    renderPage();
    await act(async () => {});

    const exportBtn = screen.getByText("sponsor_reports_page.export_csv");
    await act(async () => {
      fireEvent.click(exportBtn);
    });

    // URL/params/filename correctness lives in the action tests.
    // Here we assert the page dispatches the right thunk with the right args.
    expect(exportPurchaseDetailsCsv).toHaveBeenCalledWith({}, null, 1);
  });

  it("re-dispatches getPurchaseDetailsReport with the new page when MuiTable pagination changes (1-based)", async () => {
    // total > perPage so the TablePagination "next page" button is enabled.
    renderPage({}, { total: 25 });
    await act(async () => {});
    getPurchaseDetailsReport.mockClear();

    // MUI TablePagination renders a next-page button. MuiTable converts the
    // 0-based MUI page to a 1-based page before calling the page's onPageChange,
    // so page 2 (not 1, not 0) must reach the query.
    const nextBtn = screen.getByRole("button", { name: /next page/i });
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    expect(getPurchaseDetailsReport).toHaveBeenCalled();
    const [[calledQuery]] = getPurchaseDetailsReport.mock.calls;
    expect(calledQuery).toMatchObject({ page: 2, per_page: 10 });
  });

  it("re-dispatches getPurchaseDetailsReport with the backend order param when a sortable column header is clicked", async () => {
    renderPage();
    await act(async () => {});
    getPurchaseDetailsReport.mockClear();

    // Clicking the "Order #" sort label toggles direction. Initial sortDir is 1 (asc),
    // so MuiTable calls onSort("number", -1) → order param "-number".
    const orderHeader = screen.getByText("Order #");
    await act(async () => {
      fireEvent.click(orderHeader);
    });

    expect(getPurchaseDetailsReport).toHaveBeenCalled();
    const [[calledQuery]] = getPurchaseDetailsReport.mock.calls;
    // Sort change snaps back to page 1; order is the backend key with desc prefix.
    expect(calledQuery).toMatchObject({ page: 1, order: "-number" });
  });

  it("renders the Orders/Line-Items view toggle", async () => {
    renderPage();
    await act(async () => {});
    expect(
      screen.getByText("sponsor_reports_page.view_line_items")
    ).toBeInTheDocument();
  });

  it("dispatches getPurchaseDetailsLinesReport and renders the manifest when Line Items is selected", async () => {
    renderPage();
    await act(async () => {});
    getPurchaseDetailsLinesReport.mockClear();

    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    });

    expect(getPurchaseDetailsLinesReport).toHaveBeenCalled();
    const [[calledQuery]] = getPurchaseDetailsLinesReport.mock.calls;
    expect(calledQuery).toMatchObject({ page: 1, per_page: 50 });
    expect(calledQuery).not.toHaveProperty("order");
    // Manifest renders the line's destination
    expect(screen.getByText("Meeting Room T")).toBeInTheDocument();
  });

  it("renders the CSV export button in the Line Items view", async () => {
    renderPage();
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    });
    expect(
      screen.getByText("sponsor_reports_page.export_csv")
    ).toBeInTheDocument();
  });

  it("CSV export in the Line Items view calls exportPurchaseDetailsLinesCsv with filters", async () => {
    renderPage();
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    });

    // Guard: switching to the lines view must not trigger an export on its own.
    expect(exportPurchaseDetailsCsv).not.toHaveBeenCalled();
    expect(exportPurchaseDetailsLinesCsv).not.toHaveBeenCalled();

    const exportBtn = screen.getByText("sponsor_reports_page.export_csv");
    await act(async () => {
      fireEvent.click(exportBtn);
    });

    expect(exportPurchaseDetailsLinesCsv).toHaveBeenCalledWith({});
  });

  it("Line Items CSV export passes applied filters to exportPurchaseDetailsLinesCsv", async () => {
    renderPage();
    await act(async () => {});

    // Apply a date filter (same mechanism as the orders filter test).
    const dateInputs = document.querySelectorAll("input[type=\"date\"]");
    await act(async () => {
      fireEvent.change(dateInputs[0], { target: { value: "2026-01-01" } });
    });
    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.apply"));
    });

    // Switch to Line Items and export.
    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    });
    // Guard: neither Apply nor the view switch should have exported anything yet.
    expect(exportPurchaseDetailsLinesCsv).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.export_csv"));
    });

    // The thunk receives the live filters object; URL/params correctness lives in
    // the action tests (expandDates, filter[] assembly, etc.).
    expect(exportPurchaseDetailsLinesCsv).toHaveBeenCalledWith({
      dateFrom: "2026-01-01"
    });
  });

  describe("validation error — snackbar hook", () => {
    it("calls errorMessage with the validationError message when validationError is set", async () => {
      renderPageWithValidationError({ message: "Too many filters" });
      await act(async () => {});
      expect(mockErrorMessage).toHaveBeenCalledWith("Too many filters");
    });

    it("calls errorMessage with the i18n fallback key when validationError has no message", async () => {
      renderPageWithValidationError({});
      await act(async () => {});
      expect(mockErrorMessage).toHaveBeenCalledWith(
        "sponsor_reports_page.validation_error"
      );
    });

    it("dispatches clearPurchaseDetailsValidation after showing the error message", async () => {
      renderPageWithValidationError({ message: "Bad request" });
      await act(async () => {});
      expect(clearPurchaseDetailsValidation).toHaveBeenCalled();
    });

    it("does not call errorMessage when validationError is null", async () => {
      renderPage(); // default state has validationError: null
      await act(async () => {});
      expect(mockErrorMessage).not.toHaveBeenCalled();
    });
  });
});
