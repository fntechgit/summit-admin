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

// ── uicore date picker ────────────────────────────────────────────────────────
// The real component wraps react-datetime (jsdom-hostile). Mock it to a plain
// input that mirrors the wrapper's onChange contract: it emits a moment on
// target.value, which the page converts back to a "YYYY-MM-DD" string.
/* eslint-disable global-require */
jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/datetimepicker",
  () => {
    const React = require("react");
    const moment = require("moment-timezone");
    return {
      __esModule: true,
      default: ({ id, inputProps = {}, onChange }) =>
        React.createElement("input", {
          id,
          "data-mocked": "DateTimePicker",
          placeholder: inputProps.placeholder,
          onChange: (e) =>
            onChange({
              target: {
                id,
                type: "datetime",
                // The real wrapper emits moment(0) (epoch) on a CLEAR, not "" —
                // mirror that so the clear-path test exercises the epoch guard.
                value: e.target.value
                  ? moment.utc(e.target.value, "YYYY-MM-DD")
                  : moment(0)
              }
            })
        })
    };
  }
);
/* eslint-enable global-require */

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
  getPurchaseDetailsLinesReport,
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

function buildState(
  summaryOverrides = {},
  { total = 1, ordersFilters = {}, linesFilters = {} } = {}
) {
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
      filterOptions: {
        sponsors: [],
        statuses: [],
        forms: [],
        payment_methods: ["Card", "Invoice"]
      },
      total,
      // Pagination/sort/filter now live in the reducer slice (recorded on
      // REQUEST); the global overlay owns loading, so no per-slice `loading`.
      currentPage: 1,
      lastPage: 1,
      perPage: 10,
      order: null,
      orderDir: 1,
      filters: ordersFilters,
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
      filters: linesFilters,
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
  describe("D9 — conditional Total Refunded tile", () => {
    it("shows the Total Refunded tile when summary.total_refunded is 0 (presence check, not truthiness)", async () => {
      renderPage({ total_refunded: 0 });
      await act(async () => {});
      expect(
        screen.getByText("sponsor_reports_page.total_refunded")
      ).toBeInTheDocument();
    });
  });

  it("dispatches getPurchaseDetailsReport again when a filter changes and Apply is clicked", async () => {
    renderPage();
    await act(async () => {});
    getPurchaseDetailsReport.mockClear();

    // Set the "From date" filter to a non-empty value. The uicore date picker
    // (mocked above) is queried by its placeholder and emits a moment, which the
    // page converts back to "YYYY-MM-DD" via update({ dateFrom: "2026-01-01" }).
    const fromDate = screen.getByPlaceholderText(
      "sponsor_reports_page.filter_date_from"
    );
    await act(async () => {
      fireEvent.change(fromDate, { target: { value: "2026-01-01" } });
    });

    // Click Apply to commit the draft filter to page state
    const applyBtn = screen.getByText("sponsor_reports_page.apply");
    await act(async () => {
      fireEvent.click(applyBtn);
    });

    // Filter change → useEffect re-fires → re-fetch with new primitives
    expect(getPurchaseDetailsReport).toHaveBeenCalled();
    const [[calledFilters, calledPagination]] =
      getPurchaseDetailsReport.mock.calls;
    // The page passes the raw filter object; date expansion happens inside the thunk.
    expect(calledFilters).toMatchObject({ dateFrom: "2026-01-01" });
    expect(calledPagination).toMatchObject({ page: 1 });
  });

  it("clearing a date filter removes it — does not send a 1970 epoch date", async () => {
    renderPage();
    await act(async () => {});
    getPurchaseDetailsReport.mockClear();

    // Set a date first (empty→"" wouldn't fire React's onChange), then clear it.
    // Clearing fires onChange with moment(0) (see mock); the page must drop the
    // filter, not format the epoch into dateFrom="1970-01-01".
    const fromDate = screen.getByPlaceholderText(
      "sponsor_reports_page.filter_date_from"
    );
    await act(async () => {
      fireEvent.change(fromDate, { target: { value: "2026-01-01" } });
    });
    await act(async () => {
      fireEvent.change(fromDate, { target: { value: "" } });
    });
    const applyBtn = screen.getByText("sponsor_reports_page.apply");
    await act(async () => {
      fireEvent.click(applyBtn);
    });

    expect(getPurchaseDetailsReport).toHaveBeenCalled();
    const [[calledFilters]] = getPurchaseDetailsReport.mock.calls;
    expect(calledFilters.dateFrom).toBeUndefined();
  });

  it("re-dispatches getPurchaseDetailsReport with the backend order param when a sortable column header is clicked", async () => {
    renderPage();
    await act(async () => {});
    getPurchaseDetailsReport.mockClear();

    // Clicking the "Order #" sort label toggles direction. Initial sortDir is 1 (asc),
    // so MuiTable calls onSort("number", -1) → order param "-number".
    const orderHeader = screen.getByText("sponsor_reports_page.col_order");
    await act(async () => {
      fireEvent.click(orderHeader);
    });

    expect(getPurchaseDetailsReport).toHaveBeenCalled();
    const [[, calledPagination]] = getPurchaseDetailsReport.mock.calls;
    // Sort change snaps back to page 1; raw primitives — thunk converts order/orderDir
    // to the backend "-number" format internally via toOrderParam.
    expect(calledPagination).toMatchObject({
      page: 1,
      order: "number",
      orderDir: -1
    });
  });

  it("carries the applied Orders filter into the Line Items fetch on view switch", async () => {
    // Seed the orders slice as if a date filter had already been applied. The
    // mock store does not run reducers, so an in-test Apply never reaches the
    // lines slice; seeding the applied filter exercises the carry-on-switch
    // wiring (a single FilterBar is shared across both views).
    const history = createMemoryHistory({ initialEntries: [PAGE_URL] });
    renderWithRedux(
      <Router history={history}>
        <Route path={PAGE_ROUTE} component={PurchaseDetailsReportPage} />
      </Router>,
      {
        initialState: buildState(
          {},
          { ordersFilters: { dateFrom: "2026-01-01" } }
        )
      }
    );
    await act(async () => {});
    getPurchaseDetailsLinesReport.mockClear();

    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    });

    // Switching views fetches the lines report with the Orders filters carried
    // over, snapped back to page 1 (the entering view's filters just changed).
    expect(getPurchaseDetailsLinesReport).toHaveBeenCalledWith(
      { dateFrom: "2026-01-01" },
      expect.objectContaining({ page: 1, perPage: 50 })
    );
  });

  it("Line Items CSV export passes the lines slice filters to exportPurchaseDetailsLinesCsv", async () => {
    // Export reads the applied filters from the lines slice (recorded on REQUEST
    // in production); seed them directly since the mock store is inert.
    const history = createMemoryHistory({ initialEntries: [PAGE_URL] });
    renderWithRedux(
      <Router history={history}>
        <Route path={PAGE_ROUTE} component={PurchaseDetailsReportPage} />
      </Router>,
      {
        initialState: buildState(
          {},
          { linesFilters: { dateFrom: "2026-01-01" } }
        )
      }
    );
    await act(async () => {});
    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.view_line_items"));
    });
    // Guard: switching to the lines view must not trigger an export on its own.
    expect(exportPurchaseDetailsLinesCsv).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByText("sponsor_reports_page.export_csv"));
    });

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
  });
});
