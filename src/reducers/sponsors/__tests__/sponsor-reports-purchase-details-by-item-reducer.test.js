import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import reducer, {
  DEFAULT_STATE
} from "../sponsor-reports-purchase-details-by-item-reducer";
import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";
import {
  REQUEST_PURCHASE_DETAILS_BY_ITEM,
  RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS,
  SET_PURCHASE_DETAILS_BY_ITEM_SORT
} from "../../../actions/sponsor-reports-actions";

describe("sponsor-reports-purchase-details-by-item-reducer", () => {
  it("defaults the rollup sort to Item Code ascending", () => {
    // Both By Item layouts read as a pull sheet; a warehouse scans by code.
    expect(DEFAULT_STATE.order).toBe("itemCode");
    expect(DEFAULT_STATE.orderDir).toBe(1);
  });

  it("SET_SORT records the column and direction, leaving the rows untouched", () => {
    const prev = { ...DEFAULT_STATE, data: [{ item_code: "A1" }] };
    const state = reducer(prev, {
      type: SET_PURCHASE_DETAILS_BY_ITEM_SORT,
      payload: { order: "label", orderDir: 1 }
    });
    expect(state.order).toBe("label");
    expect(state.orderDir).toBe(1);
    expect(state.data).toBe(prev.data);
  });

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
