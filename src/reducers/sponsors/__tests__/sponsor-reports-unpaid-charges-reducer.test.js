import reducer, {
  DEFAULT_STATE
} from "../sponsor-reports-unpaid-charges-reducer";
import {
  REQUEST_UNPAID_CHARGES,
  RECEIVE_UNPAID_CHARGES,
  UNPAID_CHARGES_READ_ERROR
} from "../../../actions/sponsor-reports-actions";

describe("sponsor-reports-unpaid-charges-reducer", () => {
  it("keeps the requested controls and clears a previous error", () => {
    const state = reducer(
      { ...DEFAULT_STATE, readError: { status: 500 } },
      {
        type: REQUEST_UNPAID_CHARGES,
        payload: {
          term: "a",
          page: 2,
          perPage: 50,
          order: "total",
          orderDir: -1,
          filters: { adminOnly: false }
        }
      }
    );
    expect(state).toMatchObject({
      term: "a",
      currentPage: 2,
      perPage: 50,
      order: "total",
      orderDir: -1,
      filters: { adminOnly: false },
      readError: null
    });
  });

  it("maps the response envelope including the amount totals", () => {
    const state = reducer(DEFAULT_STATE, {
      type: RECEIVE_UNPAID_CHARGES,
      payload: {
        response: {
          data: [{ id: 1 }],
          total: 31,
          current_page: 2,
          last_page: 4,
          total_amount: 900,
          pricing_error_count: 2
        }
      }
    });
    expect(state).toMatchObject({
      rows: [{ id: 1 }],
      totalCount: 31,
      currentPage: 2,
      lastPage: 4,
      totalAmount: 900,
      pricingErrorCount: 2
    });
  });

  it("drops the previous balances on a read error", () => {
    const state = reducer(
      { ...DEFAULT_STATE, rows: [{ id: 1 }], totalCount: 1, totalAmount: 500 },
      {
        type: UNPAID_CHARGES_READ_ERROR,
        payload: { status: 500, message: "boom" }
      }
    );
    expect(state).toMatchObject({
      rows: [],
      totalCount: 0,
      totalAmount: 0,
      readError: { status: 500, message: "boom" }
    });
  });
});
