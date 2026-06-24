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

// Action creators: jest.fn() inside the factory to avoid hoisting issues.
// Import the mocked functions below to assert on .mock.calls.
jest.mock("../../../../../actions/sponsor-reports-actions", () => ({
  getPurchaseDetailsReport: jest.fn(() => ({
    type: "REQUEST_PURCHASE_DETAILS"
  })),
  getPurchaseDetailsFilters: jest.fn(() => ({
    type: "REQUEST_PURCHASE_DETAILS_FILTERS"
  })),
  PURCHASE_DETAILS_VALIDATION_CLEAR: "PURCHASE_DETAILS_VALIDATION_CLEAR",
  PURCHASE_DETAILS_READ_ERROR: "PURCHASE_DETAILS_READ_ERROR",
  PURCHASE_DETAILS_EXPORT_DISABLED: "PURCHASE_DETAILS_EXPORT_DISABLED"
}));

// Access the jest.fn() references from the mock (standard jest pattern).
const {
  getPurchaseDetailsReport,
  getPurchaseDetailsFilters
} = require("../../../../../actions/sponsor-reports-actions");

// Mock the API base-url helper so the CSV URL can be constructed in tests.
jest.mock("../../../../../utils/reports-api", () => ({
  getReportsApiBaseUrl: () => "http://test-api"
}));

// Mock getCSV used by ExportCsvButton (via connect dispatch).
jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getCSV: jest.fn(() => ({ type: "GET_CSV_MOCK" }))
}));

// Mock getAccessTokenSafely so ExportCsvButton clicks don't fail in tests.
jest.mock("../../../../../utils/methods", () => ({
  getAccessTokenSafely: jest.fn(() => Promise.resolve("test-token"))
}));

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
  invoice_total: "100.00",
  sponsor_note: ""
};

const PAGE_ROUTE = "/app/summits/:summit_id/sponsors/reports/purchase-details";
const PAGE_URL = "/app/summits/42/sponsors/reports/purchase-details";

function buildState(summaryOverrides = {}) {
  return {
    sponsorReportsPurchaseDetailsState: {
      data: [SAMPLE_ROW],
      summary: {
        total_orders: 1,
        total_items: 1,
        total_paid: "100.00",
        total_pending: "0.00",
        total_refunded: null,
        ...summaryOverrides
      },
      filterOptions: { sponsors: [], statuses: [], forms: [] },
      total: 1,
      loading: false,
      readError: null,
      validationError: null,
      exportDisabled: false
    },
    currentSummitState: {
      currentSummit: { id: 42 }
    }
  };
}

function renderPage(summaryOverrides = {}) {
  const history = createMemoryHistory({ initialEntries: [PAGE_URL] });
  return {
    history,
    ...renderWithRedux(
      <Router history={history}>
        <Route path={PAGE_ROUTE} component={PurchaseDetailsReportPage} />
      </Router>,
      { initialState: buildState(summaryOverrides) }
    )
  };
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
      renderPage({ total_refunded: "50.00" });
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

  it("renders the ExportCsvButton", async () => {
    renderPage();
    await act(async () => {});
    // ExportCsvButton renders text from T.translate("sponsor_reports_page.export_csv")
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
});
