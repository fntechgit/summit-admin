import reducer, {
  DEFAULT_STATE
} from "../sponsor-reports-unpaid-charges-reducer";
import {
  REQUEST_UNPAID_CHARGES,
  RECEIVE_UNPAID_CHARGES,
  UNPAID_CHARGES_READ_ERROR,
  SET_UNPAID_CHARGES_SORT
} from "../../../actions/sponsor-reports-actions";

describe("sponsor-reports-unpaid-charges-reducer", () => {
  it("records the controls, resets to page 1 and clears rows on REQUEST", () => {
    const state = reducer(
      {
        ...DEFAULT_STATE,
        rows: [{ id: 1 }],
        currentPage: 3,
        readError: { status: 500 }
      },
      {
        type: REQUEST_UNPAID_CHARGES,
        payload: { term: "a", filters: { adminOnly: false, stage: "open" } }
      }
    );
    expect(state).toMatchObject({
      term: "a",
      filters: { adminOnly: false, stage: "open" },
      rows: [],
      currentPage: 1,
      readError: null
    });
  });

  it("stores every row on RECEIVE", () => {
    const state = reducer(DEFAULT_STATE, {
      type: RECEIVE_UNPAID_CHARGES,
      payload: { response: { data: [{ id: 1 }, { id: 2 }] } }
    });
    expect(state.rows).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("drops rows on a read error", () => {
    const state = reducer(
      { ...DEFAULT_STATE, rows: [{ id: 1 }] },
      {
        type: UNPAID_CHARGES_READ_ERROR,
        payload: { status: 500, message: "boom" }
      }
    );
    expect(state).toMatchObject({
      rows: [],
      readError: { status: 500, message: "boom" }
    });
  });

  it("changing the sort returns to page 1", () => {
    const state = reducer(
      { ...DEFAULT_STATE, currentPage: 4 },
      { type: SET_UNPAID_CHARGES_SORT, payload: { sort: "name" } }
    );
    expect(state).toMatchObject({ sort: "name", currentPage: 1 });
  });
});
