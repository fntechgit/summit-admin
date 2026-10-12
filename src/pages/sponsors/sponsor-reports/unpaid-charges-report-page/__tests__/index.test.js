import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { renderWithRedux } from "../../../../../utils/test-utils";
import UnpaidChargesReportPage from "../index";
import {
  getUnpaidCharges,
  setUnpaidChargesSort
} from "../../../../../actions/sponsor-reports-actions";
import { DEFAULT_STATE } from "../../../../../reducers/sponsors/sponsor-reports-unpaid-charges-reducer";
import {
  groupUnpaidCharges,
  summarizeGroups
} from "../../../../../components/sponsors/reports/UnpaidChargesBySponsor";

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
  getUnpaidCharges: jest.fn(() => () => Promise.resolve()),
  setUnpaidChargesPaging: jest.fn(() => () => Promise.resolve()),
  setUnpaidChargesSort: jest.fn(() => () => Promise.resolve())
}));

const row = (over) => ({
  id: 1,
  stage: "open",
  sponsor_id: 7,
  sponsor_name: "Acme",
  cart_id: 70,
  purchase_id: null,
  purchase_number: null,
  form_code: "SHIP",
  form_name: "Shipping",
  total: 1000,
  pricing_error: false,
  added_by_admin: true,
  ...over
});
const ROWS = [
  row({ id: 1 }),
  row({
    id: 2,
    form_code: "EL",
    form_name: "Electrical",
    total: null,
    pricing_error: true
  }),
  row({
    id: 3,
    stage: "invoiced",
    cart_id: 71,
    purchase_id: 801,
    purchase_number: "000801",
    total: 5000
  }),
  row({
    id: 5,
    sponsor_id: 9,
    sponsor_name: "Globex",
    stage: "processing",
    cart_id: 90,
    purchase_id: 901,
    purchase_number: "000901",
    total: 9000
  })
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
          ...overrides
        }
      }
    }
  );

describe("UnpaidChargesReportPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches with the admin-only default on mount", () => {
    renderPage();
    expect(getUnpaidCharges).toHaveBeenCalledWith("", {
      adminOnly: true,
      stage: ""
    });
  });

  it("refetches without the admin filter when the toggle is cleared", async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "sponsor_reports_page.unpaid_admin_only"
      })
    );
    expect(getUnpaidCharges).toHaveBeenLastCalledWith("", {
      adminOnly: false,
      stage: ""
    });
  });

  it("refetches with the picked stage", async () => {
    renderPage();
    await userEvent.click(
      screen.getByRole("combobox", {
        name: "sponsor_reports_page.unpaid_filter_stage"
      })
    );
    await userEvent.click(
      screen.getByRole("option", {
        name: "sponsor_reports_page.unpaid_stage_invoiced"
      })
    );
    expect(getUnpaidCharges).toHaveBeenLastCalledWith("", {
      adminOnly: true,
      stage: "invoiced"
    });
  });

  it("re-sorts client-side without refetching", async () => {
    renderPage();
    getUnpaidCharges.mockClear();
    await userEvent.click(
      screen.getByRole("combobox", {
        name: "sponsor_reports_page.unpaid_sort"
      })
    );
    await userEvent.click(
      screen.getByRole("option", {
        name: "sponsor_reports_page.unpaid_sort_name"
      })
    );
    expect(setUnpaidChargesSort).toHaveBeenCalledWith("name");
    expect(getUnpaidCharges).not.toHaveBeenCalled();
  });

  it("summarizes the grouped total and sponsor count", () => {
    renderPage();
    const summary = summarizeGroups(groupUnpaidCharges(ROWS));
    const total = screen.getByText("sponsor_reports_page.unpaid_tile_total");
    expect(total.parentElement).toHaveTextContent(
      currencyAmountFromCents(summary.total)
    );
    const sponsors = screen.getByText(
      "sponsor_reports_page.unpaid_tile_sponsors"
    );
    expect(within(sponsors.parentElement).getByText("2")).toBeInTheDocument();
  });

  it("shows the server message when the read failed, with no tiles or cards", () => {
    renderPage({ rows: [], readError: { status: 500, message: "boom" } });
    expect(
      screen.getByText(/sponsor_reports_page.unpaid_read_error/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText("sponsor_reports_page.unpaid_tile_total")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
  });

  it("falls back to the generic report error when the server sends no message", () => {
    renderPage({ rows: [], readError: { status: 500, message: "" } });
    expect(
      screen.getByText("sponsor_reports_page.read_error")
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/sponsor_reports_page.unpaid_read_error/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("sponsor_reports_page.unpaid_tile_total")
    ).not.toBeInTheDocument();
  });
});
