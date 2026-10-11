import "@testing-library/jest-dom";
import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { currencyAmountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import UnpaidChargesBySponsor, {
  groupUnpaidCharges,
  sortGroups,
  summarizeGroups
} from "../UnpaidChargesBySponsor";
import history from "../../../../history";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: {
    translate: (key, params) =>
      params ? `${key} ${Object.values(params).join(" ")}` : key
  }
}));
jest.mock("../../../../history", () => ({
  __esModule: true,
  default: { push: jest.fn() }
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
    id: 4,
    stage: "invoiced",
    cart_id: 72,
    purchase_id: 802,
    purchase_number: "000802",
    total: 2000
  }),
  row({
    id: 6,
    stage: "invoiced",
    cart_id: 71,
    purchase_id: 801,
    purchase_number: "000801",
    form_code: "L",
    form_name: "Labor",
    total: 500
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
  }),
  row({
    id: 7,
    sponsor_id: 10,
    sponsor_name: "Initech",
    stage: "paying_by_card",
    cart_id: 100,
    purchase_id: 1001,
    purchase_number: "001001",
    total: 3000
  }),
  row({
    id: 8,
    sponsor_id: 11,
    sponsor_name: "Acme",
    cart_id: 110,
    purchase_id: 1101,
    purchase_number: "001101",
    total: 8500
  }),
  row({
    id: 9,
    sponsor_id: 12,
    sponsor_name: "",
    cart_id: 120,
    total: null,
    pricing_error: true
  })
];

describe("groupUnpaidCharges", () => {
  const bySponsor = (id) =>
    groupUnpaidCharges(ROWS).find((g) => g.sponsorId === id);

  it("groups a sponsor's open cart and each order into separate entries", () => {
    const acme = bySponsor(7);
    expect(acme.entries.map((e) => e.key)).toEqual([
      "cart-70",
      "order-801",
      "order-802"
    ]);
    expect(acme.stageCounts).toEqual({ open: 1, invoiced: 2 });
    expect(acme.total).toBe(8500);
    expect(acme.missingCount).toBe(1);
    expect(acme.entries[0]).toMatchObject({
      total: 1000,
      missingCount: 1,
      formCodes: ["SHIP", "EL"]
    });
    expect(acme.entries[1]).toMatchObject({
      total: 5500,
      formCodes: ["SHIP", "L"]
    });
    expect(acme.entries[1].forms).toHaveLength(2);
  });

  it("keys an open cart by cart even when it carries a purchase, and paying-by-card by order", () => {
    expect(bySponsor(11).entries.map((e) => e.key)).toEqual(["cart-110"]);
    expect(bySponsor(10).entries.map((e) => e.key)).toEqual(["order-1001"]);
  });

  it("keeps same-named sponsors apart and counts a duplicated row once", () => {
    const groups = groupUnpaidCharges([...ROWS, ROWS[2]]);
    expect(
      groups
        .filter((g) => g.sponsorName === "Acme")
        .map((g) => g.sponsorId)
        .sort((a, b) => a - b)
    ).toEqual([7, 11]);
    expect(groups.find((g) => g.sponsorId === 7).total).toBe(8500);
  });

  it("sorts by balance or name with stable ties and unnamed sponsors last", () => {
    const groups = groupUnpaidCharges(ROWS);
    expect(sortGroups(groups, "balance").map((g) => g.sponsorId)).toEqual([
      9, 7, 11, 10, 12
    ]);
    expect(sortGroups(groups, "name").map((g) => g.sponsorId)).toEqual([
      7, 11, 9, 10, 12
    ]);
  });

  it("summarizes totals by where the money sits, excluding missing prices", () => {
    expect(summarizeGroups(groupUnpaidCharges(ROWS))).toEqual({
      total: 29000,
      open: 9500,
      checkedOut: 19500,
      sponsors: 5,
      missing: 2
    });
  });
});

describe("UnpaidChargesBySponsor", () => {
  const renderIt = () =>
    render(
      <UnpaidChargesBySponsor
        groups={sortGroups(groupUnpaidCharges(ROWS), "name")}
        summitId={73}
        currentPage={1}
        perPage={10}
        onPageChange={jest.fn()}
        onPerPageChange={jest.fn()}
      />
    );

  const openSponsor = (name, index = 0) =>
    userEvent.click(screen.getAllByText(name)[index]);

  it("starts with sponsors collapsed and opens them on click", async () => {
    renderIt();
    expect(
      screen.queryByText("sponsor_reports_page.unpaid_order_label 000801")
    ).not.toBeInTheDocument();
    await openSponsor("Acme");
    expect(
      screen.getByText("sponsor_reports_page.unpaid_order_label 000801")
    ).toBeVisible();
  });

  it("expands an entry to its forms and flags the missing price on that form", async () => {
    renderIt();
    await openSponsor("Acme");
    const cartRow = screen
      .getByText("sponsor_reports_page.unpaid_cart_label 70")
      .closest("tr");
    await userEvent.click(
      within(cartRow).getByRole("button", {
        name: "sponsor_reports_page.unpaid_show_forms"
      })
    );
    const electrical = screen.getByText("Electrical").closest("tr");
    expect(
      within(electrical).getByText("sponsor_reports_page.unpaid_price_missing")
    ).toBeInTheDocument();
  });

  it("shows price missing instead of $0 for a sponsor with no known prices", () => {
    renderIt();
    const unknown = screen
      .getByText("sponsor_reports_page.pivot_unknown_sponsor")
      .closest(".MuiAccordionSummary-root");
    expect(
      within(unknown).getByText("sponsor_reports_page.unpaid_price_missing")
    ).toBeInTheDocument();
    expect(
      within(unknown).queryByText(currencyAmountFromCents(0))
    ).not.toBeInTheDocument();
  });

  it("links carts and orders to the right pages", async () => {
    renderIt();
    await openSponsor("Acme");
    const order = screen
      .getByText("sponsor_reports_page.unpaid_order_label 000801")
      .closest("tr");
    await userEvent.click(
      within(order).getByRole("button", {
        name: "sponsor_reports_page.unpaid_open_order"
      })
    );
    expect(history.push).toHaveBeenLastCalledWith(
      "/app/summits/73/sponsors/7/purchases/801"
    );
    const cart = screen
      .getByText("sponsor_reports_page.unpaid_cart_label 70")
      .closest("tr");
    await userEvent.click(
      within(cart).getByRole("button", {
        name: "sponsor_reports_page.unpaid_open_cart"
      })
    );
    expect(history.push).toHaveBeenLastCalledWith(
      "/app/summits/73/sponsors/7/cart"
    );
    await openSponsor("Globex");
    const processing = screen
      .getByText("sponsor_reports_page.unpaid_order_label 000901")
      .closest("tr");
    await userEvent.click(
      within(processing).getByRole("button", {
        name: "sponsor_reports_page.unpaid_open_order"
      })
    );
    expect(history.push).toHaveBeenLastCalledWith(
      "/app/summits/73/sponsors/9/purchases/901"
    );
    await openSponsor("Initech");
    const card = screen
      .getByText("sponsor_reports_page.unpaid_order_label 001001")
      .closest("tr");
    await userEvent.click(
      within(card).getByRole("button", {
        name: "sponsor_reports_page.unpaid_open_cart"
      })
    );
    expect(history.push).toHaveBeenLastCalledWith(
      "/app/summits/73/sponsors/10/cart"
    );
  });

  it("expand all opens every sponsor on the page", async () => {
    renderIt();
    await userEvent.click(
      screen.getByRole("button", {
        name: "sponsor_reports_page.byitem_expand_all"
      })
    );
    expect(
      screen.getByText("sponsor_reports_page.unpaid_order_label 000801")
    ).toBeVisible();
    expect(
      screen.getByText("sponsor_reports_page.unpaid_order_label 000901")
    ).toBeVisible();
  });
});
