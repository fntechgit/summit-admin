import "@testing-library/jest-dom";
import React from "react";
import { screen } from "@testing-library/react";
import { renderWithRedux } from "utils/test-utils";
import SkippedOrdersBanner from "../SkippedOrdersBanner";

// Echo the key plus interpolation values so the count and time are assertable.
jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (k, opts) => (opts ? `${k}|${Object.values(opts).join(",")}` : k)
}));

const order = (over = {}) => ({
  purchase_id: 1,
  purchase_number: "ORD-001",
  sponsor_id: 7,
  sponsor_name: "Acme Corp",
  reason: "missing_dim",
  last_error: null,
  ...over
});

// 2025-01-01T00:00:00Z
const OLDEST = 1735689600;

describe("SkippedOrdersBanner", () => {
  it("renders nothing when count is 0", () => {
    renderWithRedux(
      <SkippedOrdersBanner orders={[]} count={0} oldest={null} />
    );
    expect(screen.queryByTestId("reports-skipped-orders")).toBeNull();
  });

  it("lists every order with sponsor, reason label, count and first-failed time", () => {
    renderWithRedux(
      <SkippedOrdersBanner
        orders={[
          order(),
          order({
            purchase_id: 2,
            purchase_number: "ORD-002",
            sponsor_name: "Globex",
            reason: "write_error"
          })
        ]}
        count={2}
        oldest={OLDEST}
      />
    );
    const banner = screen.getByTestId("reports-skipped-orders");
    expect(banner).toHaveTextContent(
      "sponsor_reports_page.skipped_orders_title|2"
    );
    expect(banner).toHaveTextContent(
      "sponsor_reports_page.skipped_orders_since|2025-01-01 12:00 AM"
    );
    expect(banner).toHaveTextContent("ORD-001");
    expect(banner).toHaveTextContent("Acme Corp");
    expect(banner).toHaveTextContent(
      "sponsor_reports_page.skipped_reason_missing_dim"
    );
    expect(banner).toHaveTextContent("ORD-002");
    expect(banner).toHaveTextContent("Globex");
    expect(banner).toHaveTextContent(
      "sponsor_reports_page.skipped_reason_write_error"
    );
  });

  it("never renders last_error", () => {
    renderWithRedux(
      <SkippedOrdersBanner
        orders={[order({ last_error: "DataError: secret" })]}
        count={1}
        oldest={OLDEST}
      />
    );
    expect(screen.getByTestId("reports-skipped-orders")).toBeInTheDocument();
    expect(screen.queryByText(/DataError/)).toBeNull();
    expect(screen.queryByText(/secret/)).toBeNull();
  });

  it("falls back to the unknown-sponsor label when sponsor_name is null", () => {
    renderWithRedux(
      <SkippedOrdersBanner
        orders={[order({ sponsor_name: null })]}
        count={1}
        oldest={OLDEST}
      />
    );
    expect(
      screen.getByText(/sponsor_reports_page\.skipped_unknown_sponsor/)
    ).toBeInTheDocument();
  });

  it("labels an order by its id when purchase_number is null", () => {
    renderWithRedux(
      <SkippedOrdersBanner
        orders={[order({ purchase_id: 42, purchase_number: null })]}
        count={1}
        oldest={OLDEST}
      />
    );
    const banner = screen.getByTestId("reports-skipped-orders");
    expect(banner).toHaveTextContent(
      "sponsor_reports_page.skipped_order_id|42"
    );
    expect(banner).not.toHaveTextContent("null");
  });

  it("uses the singular title for exactly one order", () => {
    renderWithRedux(
      <SkippedOrdersBanner orders={[order()]} count={1} oldest={OLDEST} />
    );
    const banner = screen.getByTestId("reports-skipped-orders");
    expect(banner).toHaveTextContent(
      "sponsor_reports_page.skipped_orders_title_one"
    );
    expect(banner).not.toHaveTextContent(
      "sponsor_reports_page.skipped_orders_title|"
    );
  });

  it("falls back to a generic reason label for an unknown reason", () => {
    renderWithRedux(
      <SkippedOrdersBanner
        orders={[order({ reason: "something_new" })]}
        count={1}
        oldest={OLDEST}
      />
    );
    const banner = screen.getByTestId("reports-skipped-orders");
    expect(banner).toHaveTextContent(
      "sponsor_reports_page.skipped_reason_unknown"
    );
    expect(banner).not.toHaveTextContent("something_new");
  });

  it("keeps the real catalog placeholders aligned with the component options", () => {
    // The i18n mock above joins option values, so a renamed placeholder in the
    // catalog would otherwise go unnoticed.
    // eslint-disable-next-line global-require
    const page = require("../../../../i18n/en.json").sponsor_reports_page;
    expect(page.skipped_orders_title).toContain("{count}");
    expect(page.skipped_orders_since).toContain("{time}");
    expect(page.skipped_order_id).toContain("{id}");
  });
});
