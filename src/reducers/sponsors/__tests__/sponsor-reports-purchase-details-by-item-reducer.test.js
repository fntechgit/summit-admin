import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import reducer, {
  DEFAULT_STATE
} from "../sponsor-reports-purchase-details-by-item-reducer";
import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";
import {
  REQUEST_PURCHASE_DETAILS_BY_ITEM,
  RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS,
  PURCHASE_DETAILS_BY_ITEM_READ_ERROR,
  SET_PURCHASE_DETAILS_BY_ITEM_PAGING
} from "../../../actions/sponsor-reports-actions";

describe("sponsor-reports-purchase-details-by-item-reducer", () => {
  it("REQUEST records the active filters and clears readError", () => {
    const prev = { ...DEFAULT_STATE, readError: { status: 403 } };
    const state = reducer(prev, {
      type: REQUEST_PURCHASE_DETAILS_BY_ITEM,
      payload: { filters: { sponsorIds: [17] } }
    });
    expect(state.filters).toEqual({ sponsorIds: [17] });
    expect(state.readError).toBeNull();
  });

  it("RECEIVE_ROWS commits data + summary atomically and clears readError", () => {
    const rows = [{ item_code: "A1" }, { item_code: "B1" }];
    const summary = { total_orders: 11 };
    const state = reducer(
      { ...DEFAULT_STATE, readError: { status: 500 } },
      {
        type: RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS,
        payload: { response: { data: rows, summary } }
      }
    );
    expect(state.data).toEqual(rows);
    expect(state.summary).toEqual(summary);
    expect(state.readError).toBeNull();
  });

  it("RECEIVE_ROWS falls back to a null summary when the envelope omits it", () => {
    const state = reducer(
      { ...DEFAULT_STATE, summary: { total_orders: 11 } },
      {
        type: RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS,
        payload: { response: { data: [] } }
      }
    );
    expect(state.summary).toBeNull();
  });

  it("SET_PAGING updates currentPage and perPage only", () => {
    const prev = {
      ...DEFAULT_STATE,
      data: [{ item_code: "A1" }],
      filters: { sponsorIds: [17] },
      readError: { status: 403 }
    };
    const state = reducer(prev, {
      type: SET_PURCHASE_DETAILS_BY_ITEM_PAGING,
      payload: { currentPage: 3, perPage: 20 }
    });
    expect(state.currentPage).toBe(3);
    expect(state.perPage).toBe(20);
    expect(state.data).toEqual(prev.data);
    expect(state.filters).toEqual(prev.filters);
    expect(state.readError).toEqual(prev.readError);
  });

  it("READ_ERROR stores the error payload", () => {
    const state = reducer(DEFAULT_STATE, {
      type: PURCHASE_DETAILS_BY_ITEM_READ_ERROR,
      payload: { status: 403, message: "nope" }
    });
    expect(state.readError).toEqual({ status: 403, message: "nope" });
  });

  it.each([[SET_CURRENT_SUMMIT], [LOGOUT_USER]])(
    "%s resets to DEFAULT_STATE",
    (type) => {
      const dirty = {
        ...DEFAULT_STATE,
        data: [{ item_code: "A1" }],
        currentPage: 4
      };
      expect(reducer(dirty, { type, payload: {} })).toEqual(DEFAULT_STATE);
    }
  );
});
