import reducer, {
  DEFAULT_STATE
} from "../sponsor-reports-purchase-details-lines-reducer";
import {
  REQUEST_PURCHASE_DETAILS_LINES,
  RECEIVE_PURCHASE_DETAILS_LINES,
  PURCHASE_DETAILS_LINES_READ_ERROR
} from "../../../actions/sponsor-reports-actions";
import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";

describe("sponsor-reports-purchase-details-lines-reducer", () => {
  it("REQUEST records paging/filters and clears readError", () => {
    const s = reducer(
      { ...DEFAULT_STATE, readError: { message: "old" } },
      {
        type: REQUEST_PURCHASE_DETAILS_LINES,
        payload: { currentPage: 2, perPage: 50, filters: { search: "acme" } }
      }
    );
    expect(s.currentPage).toBe(2);
    expect(s.perPage).toBe(50);
    expect(s.filters).toEqual({ search: "acme" });
    expect(s.readError).toBeNull();
  });

  it("RECEIVE maps the snake_case envelope to camelCase state", () => {
    const s = reducer(DEFAULT_STATE, {
      type: RECEIVE_PURCHASE_DETAILS_LINES,
      payload: {
        response: {
          data: [{ item_code: "AV1" }],
          total: 7,
          current_page: 2,
          last_page: 3,
          per_page: 50,
          summary: { total_orders: 1 }
        }
      }
    });
    expect(s).toMatchObject({
      data: [{ item_code: "AV1" }],
      total: 7,
      currentPage: 2,
      lastPage: 3,
      perPage: 50,
      summary: { total_orders: 1 },
      readError: null
    });
  });

  it("READ_ERROR stores the error payload", () => {
    const s = reducer(
      { ...DEFAULT_STATE },
      { type: PURCHASE_DETAILS_LINES_READ_ERROR, payload: { message: "boom" } }
    );
    expect(s.readError).toEqual({ message: "boom" });
  });

  it("resets to DEFAULT_STATE when the summit changes", () => {
    const s = reducer(
      { ...DEFAULT_STATE, data: [{ item_code: "AV1" }] },
      { type: SET_CURRENT_SUMMIT }
    );
    expect(s).toEqual(DEFAULT_STATE);
  });
});
