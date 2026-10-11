import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../../../utils/test-utils";
import UnpaidChargesReportPage from "../index";
import { getUnpaidCharges } from "../../../../../actions/sponsor-reports-actions";
import { DEFAULT_STATE } from "../../../../../reducers/sponsors/sponsor-reports-unpaid-charges-reducer";
import history from "../../../../../history";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: {
    translate: (key, params) =>
      params ? `${key} ${Object.values(params).join(" ")}` : key
  }
}));
jest.mock("../../../../../history", () => ({
  __esModule: true,
  default: { push: jest.fn() }
}));
jest.mock("../../../../../actions/sponsor-reports-actions", () => ({
  ...jest.requireActual("../../../../../actions/sponsor-reports-actions"),
  getUnpaidCharges: jest.fn(() => () => Promise.resolve())
}));

const ROWS = [
  {
    id: 1,
    stage: "open",
    sponsor_id: 7,
    sponsor_name: "Acme",
    cart_id: 70,
    purchase_id: null,
    form_name: "Shipping and Material Handling",
    total: 234400,
    pricing_error: false
  },
  {
    id: 2,
    stage: "invoiced",
    sponsor_id: 8,
    sponsor_name: "Globex",
    cart_id: 80,
    purchase_id: 801,
    form_name: "Labor and Equipment",
    total: null,
    pricing_error: true
  }
];

const renderPage = (overrides = {}) =>
  renderWithRedux(
    <UnpaidChargesReportPage match={{ url: "/r/unpaid-charges" }} />,
    {
      initialState: {
        currentSummitState: { currentSummit: { id: 73 } },
        sponsorReportsUnpaidChargesState: {
          ...DEFAULT_STATE,
          rows: ROWS,
          totalCount: 2,
          totalAmount: 234400,
          pricingErrorCount: 1,
          ...overrides
        }
      }
    }
  );

describe("UnpaidChargesReportPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches with the admin-only default on mount", () => {
    renderPage();
    expect(getUnpaidCharges).toHaveBeenCalledWith(
      "",
      1,
      DEFAULT_STATE.perPage,
      "sponsor_name",
      1,
      { adminOnly: true }
    );
  });

  it("shows a missing price instead of $0 and flags it in the summary", () => {
    renderPage();
    const globex = screen.getByText("Globex").closest("tr");
    expect(
      within(globex).getByText("sponsor_reports_page.unpaid_price_missing")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sponsor_reports_page.unpaid_price_missing_count 1/)
    ).toBeInTheDocument();
  });

  it("refetches from page 1 without the admin filter when the toggle is cleared", async () => {
    renderPage({ currentPage: 3 });
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "sponsor_reports_page.unpaid_admin_only"
      })
    );
    expect(getUnpaidCharges).toHaveBeenLastCalledWith(
      "",
      1,
      DEFAULT_STATE.perPage,
      "sponsor_name",
      1,
      { adminOnly: false }
    );
  });

  it("falls back to the generic report error when the server sends no message", () => {
    renderPage({ rows: [], readError: { status: 500, message: "" } });
    expect(
      screen.getByText("sponsor_reports_page.read_error")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/sponsor_reports_page.unpaid_read_error/)
    ).not.toBeInTheDocument();
  });

  it("shows an inline error and no totals when the read failed", () => {
    renderPage({
      rows: [],
      totalCount: 0,
      totalAmount: 0,
      readError: { status: 500, message: "boom" }
    });
    expect(
      screen.getByText(/sponsor_reports_page.unpaid_read_error/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/sponsor_reports_page.unpaid_summary/)
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("labels processing rows and links them to the purchase", async () => {
    renderPage({
      rows: [
        {
          ...ROWS[1],
          id: 3,
          sponsor_name: "Initech",
          stage: "processing",
          purchase_id: 901,
          sponsor_id: 9,
          pricing_error: false,
          total: 5000
        }
      ]
    });
    const initech = screen.getByText("Initech").closest("tr");
    expect(
      within(initech).getByText("sponsor_reports_page.unpaid_stage_processing")
    ).toBeInTheDocument();
    await userEvent.click(
      within(initech).getByRole("button", {
        name: "sponsor_reports_page.unpaid_open_order"
      })
    );
    expect(history.push).toHaveBeenLastCalledWith(
      "/app/summits/73/sponsors/9/purchases/901"
    );
  });

  it("links open rows to the cart and invoiced rows to the purchase", async () => {
    renderPage();
    const acme = screen.getByText("Acme").closest("tr");
    await userEvent.click(
      within(acme).getByRole("button", {
        name: "sponsor_reports_page.unpaid_open_cart"
      })
    );
    expect(history.push).toHaveBeenLastCalledWith(
      "/app/summits/73/sponsors/7/cart"
    );
    const globex = screen.getByText("Globex").closest("tr");
    await userEvent.click(
      within(globex).getByRole("button", {
        name: "sponsor_reports_page.unpaid_open_order"
      })
    );
    expect(history.push).toHaveBeenLastCalledWith(
      "/app/summits/73/sponsors/8/purchases/801"
    );
  });
});
