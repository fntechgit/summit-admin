import {
  REQUEST_SETTINGS,
  RECEIVE_SETTINGS
} from "../../../actions/marketing-actions";
import marketingSettingListReducer from "../marketing-setting-list-reducer";

const DEFAULT_STATE = {
  settings: [],
  term: null,
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalSettings: 0
};

describe("marketingSettingListReducer", () => {
  test("REQUEST_SETTINGS stores the requested page and page size", () => {
    const state = marketingSettingListReducer(DEFAULT_STATE, {
      type: REQUEST_SETTINGS,
      payload: {
        term: "banner",
        currentPage: 2,
        perPage: 50,
        order: "key",
        orderDir: 0
      }
    });

    expect(state).toMatchObject({
      term: "banner",
      currentPage: 2,
      perPage: 50,
      order: "key",
      orderDir: 0
    });
  });

  test("RECEIVE_SETTINGS does not revert the page size REQUEST_SETTINGS just stored", () => {
    const requested = marketingSettingListReducer(DEFAULT_STATE, {
      type: REQUEST_SETTINGS,
      payload: {
        term: null,
        currentPage: 1,
        perPage: 50,
        order: "id",
        orderDir: 1
      }
    });

    const state = marketingSettingListReducer(requested, {
      type: RECEIVE_SETTINGS,
      payload: {
        response: {
          data: [
            {
              id: 1,
              key: "SOME_KEY",
              type: "TEXT",
              value: "hi",
              selection_plan_id: null
            }
          ],
          total: 1,
          current_page: 1,
          last_page: 1
        }
      }
    });

    expect(state.perPage).toBe(50);
  });
});
