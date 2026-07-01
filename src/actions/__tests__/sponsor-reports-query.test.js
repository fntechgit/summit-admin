// Query builders live in sponsor-reports-actions.js (folded in — they are used
// only by that action file); this suite exercises them directly.
import {
  buildReportQuery,
  buildPurchaseQuery,
  buildPurchaseLinesQuery,
  toOrderParam
} from "../sponsor-reports-actions";

describe("buildReportQuery", () => {
  it("returns an empty object for no filters", () => {
    expect(buildReportQuery()).toStrictEqual({});
  });

  it("emits a single comma-OR bracket for multi-select sponsorIds", () => {
    expect(buildReportQuery({ sponsorIds: [1, 2, 3] })).toStrictEqual({
      "filter[]": ["sponsor_id==1,sponsor_id==2,sponsor_id==3"]
    });
  });

  it("coerces numeric-string sponsorIds to integers", () => {
    expect(buildReportQuery({ sponsorIds: ["10", "20"] })).toStrictEqual({
      "filter[]": ["sponsor_id==10,sponsor_id==20"]
    });
  });

  it("drops non-numeric sponsorIds so it never emits sponsor_id==NaN", () => {
    expect(
      buildReportQuery({ sponsorIds: [1, "abc", undefined, null, 2] })
    ).toStrictEqual({
      "filter[]": ["sponsor_id==1,sponsor_id==2"]
    });
  });

  it("omits the sponsor filter entirely when all ids are non-numeric", () => {
    expect(buildReportQuery({ sponsorIds: ["abc", null] })).toStrictEqual({});
  });

  it("adds single-value dimensions as separate AND brackets", () => {
    expect(
      buildReportQuery({ sponsorIds: [1], status: "Paid", formCode: "AS" })
    ).toStrictEqual({
      "filter[]": ["sponsor_id==1", "status==Paid", "form_code==AS"]
    });
  });

  it("sets include_cancelled when status is Canceled", () => {
    expect(buildReportQuery({ status: "Canceled" })).toStrictEqual({
      "filter[]": ["status==Canceled"],
      include_cancelled: "true"
    });
  });

  it("passes through search/order/pagination", () => {
    expect(
      buildReportQuery({
        search: "acme",
        order: "-number",
        page: 2,
        perPage: 25
      })
    ).toStrictEqual({
      search: "acme",
      order: "-number",
      page: 2,
      per_page: 25
    });
  });

  it("adds payment_method as its own single-value AND bracket", () => {
    expect(buildReportQuery({ paymentMethod: "Invoice" })).toStrictEqual({
      "filter[]": ["payment_method==Invoice"]
    });
  });

  it("composes payment_method with sponsor/status/form brackets (AND)", () => {
    expect(
      buildReportQuery({
        sponsorIds: [1],
        status: "Paid",
        formCode: "AS",
        paymentMethod: "Card"
      })
    ).toStrictEqual({
      "filter[]": [
        "sponsor_id==1",
        "status==Paid",
        "form_code==AS",
        "payment_method==Card"
      ]
    });
  });

  it("omits payment_method when absent or empty", () => {
    expect(buildReportQuery({ paymentMethod: "" })).toStrictEqual({});
    expect(buildReportQuery({})).toStrictEqual({});
  });
});

describe("buildPurchaseQuery (orders)", () => {
  it("expands dates and includes a formatted order param", () => {
    const q = buildPurchaseQuery(
      { dateFrom: "2026-01-01", dateTo: "2026-01-31" },
      { page: 1, perPage: 10, order: "order_date", orderDir: -1 }
    );
    expect(q["filter[]"]).toEqual(
      expect.arrayContaining([
        "order_date>=2026-01-01T00:00:00Z",
        "order_date<2026-02-01T00:00:00Z"
      ])
    );
    expect(q.order).toBe("-order_date");
    expect(q).toMatchObject({ page: 1, per_page: 10 });
  });
  it("omits page/per_page/order when not provided (export shape)", () => {
    const q = buildPurchaseQuery({ status: "Paid" }, {});
    expect(q).not.toHaveProperty("page");
    expect(q).not.toHaveProperty("per_page");
    expect(q).not.toHaveProperty("order");
    expect(q["filter[]"]).toEqual(["status==Paid"]);
  });
});

describe("buildPurchaseLinesQuery", () => {
  it("expands dates, carries pagination, and never sets order", () => {
    const q = buildPurchaseLinesQuery(
      { dateFrom: "2026-01-01" },
      { page: 2, perPage: 50 }
    );
    expect(q["filter[]"]).toEqual(["order_date>=2026-01-01T00:00:00Z"]);
    expect(q).toMatchObject({ page: 2, per_page: 50 });
    expect(q).not.toHaveProperty("order");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// toOrderParam — moved here from OrdersTable since it is query-layer logic
// ────────────────────────────────────────────────────────────────────────────
describe("toOrderParam", () => {
  it("encodes asc (dir=1) and desc (dir=-1)", () => {
    expect(toOrderParam("number", 1)).toBe("number");
    expect(toOrderParam("number", -1)).toBe("-number");
    expect(toOrderParam("order_date", -1)).toBe("-order_date");
    expect(toOrderParam("invoice_total", 1)).toBe("invoice_total");
  });

  it("returns undefined when columnKey is falsy", () => {
    expect(toOrderParam(null, 1)).toBeUndefined();
    expect(toOrderParam(undefined, 1)).toBeUndefined();
    expect(toOrderParam("", 1)).toBeUndefined();
  });
});
