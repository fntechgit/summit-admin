import tagListReducer from "../tag-list-reducer";

import {
  REQUEST_TAGS,
  RECEIVE_TAGS,
  TAG_DELETED
} from "../../../actions/tag-actions";

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMoment: () => ({ format: () => "January 1st 2020, 12:00:00 am" })
}));

const DEFAULT_STATE = {
  tags: {},
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalTags: 0
};

describe("tagListReducer", () => {
  describe("REQUEST_TAGS — redux-persist stale state regression", () => {
    // Regression: before the fix, REQUEST_TAGS did not reset tags.
    // Users who had visited /app/tags before the MUI migration had
    // tags: {} (object) persisted in localStorage. On the next load,
    // the rehydrated {} was passed as data to MuiTable, which called
    // {}.map() and crashed. REQUEST_TAGS must reset tags to [] so the
    // table receives an array before RECEIVE_TAGS arrives.
    it("resets tags to [] when stale persisted state has tags as an object", () => {
      const staleState = { ...DEFAULT_STATE, tags: {} };
      const action = {
        type: REQUEST_TAGS,
        payload: { order: "id", orderDir: 1, term: "", page: 1, perPage: 10 }
      };

      const result = tagListReducer(staleState, action);

      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags).toEqual([]);
    });

    it("resets tags to [] when current state already has a populated array", () => {
      const populatedState = {
        ...DEFAULT_STATE,
        tags: [{ id: 1, tag: "existing" }]
      };
      const action = {
        type: REQUEST_TAGS,
        payload: { order: "id", orderDir: 1, term: "", page: 1, perPage: 10 }
      };

      const result = tagListReducer(populatedState, action);

      expect(result.tags).toEqual([]);
    });
  });

  describe("RECEIVE_TAGS", () => {
    it("sets tags as an array from API response", () => {
      const action = {
        type: RECEIVE_TAGS,
        payload: {
          response: {
            current_page: 1,
            total: 2,
            last_page: 1,
            data: [
              { id: 1, tag: "Foo", created: 0, last_edited: 0 },
              { id: 2, tag: "Bar", created: 0, last_edited: 0 }
            ]
          }
        }
      };

      const result = tagListReducer(DEFAULT_STATE, action);

      expect(Array.isArray(result.tags)).toBe(true);
      expect(result.tags).toHaveLength(2);
      expect(result.totalTags).toBe(2);
    });
  });

  describe("TAG_DELETED", () => {
    it("removes the deleted tag from the list", () => {
      const state = {
        ...DEFAULT_STATE,
        tags: [
          { id: 1, tag: "Foo" },
          { id: 2, tag: "Bar" }
        ]
      };

      const result = tagListReducer(state, {
        type: TAG_DELETED,
        payload: { tagId: 1 }
      });

      expect(result.tags).toEqual([{ id: 2, tag: "Bar" }]);
    });
  });
});
