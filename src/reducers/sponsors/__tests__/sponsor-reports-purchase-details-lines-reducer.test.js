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
  it("returns DEFAULT_STATE for an unknown action", () => {
    expect(reducer(undefined, { type: "X" })).toEqual(DEFAULT_STATE);
  });

  it("REQUEST sets loading and clears readError", () => {
    const s = reducer(
      { ...DEFAULT_STATE, readError: { message: "old" } },
      { type: REQUEST_PURCHASE_DETAILS_LINES }
    );
    expect(s.loading).toBe(true);
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
      loading: false,
      readError: null
    });
  });

  it("READ_ERROR stores the error payload and clears loading", () => {
    const s = reducer(
      { ...DEFAULT_STATE, loading: true },
      { type: PURCHASE_DETAILS_LINES_READ_ERROR, payload: { message: "boom" } }
    );
    expect(s.readError).toEqual({ message: "boom" });
    expect(s.loading).toBe(false);
  });

  it("resets to DEFAULT_STATE when the summit changes", () => {
    const s = reducer(
      { ...DEFAULT_STATE, data: [{ item_code: "AV1" }] },
      { type: SET_CURRENT_SUMMIT }
    );
    expect(s).toEqual(DEFAULT_STATE);
  });
});
