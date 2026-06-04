import { RECEIVE_SUMMIT_SPONSORSHIP_TYPES } from "../../../actions/summit-actions";
import sponsorFormsListReducer, {
  DEFAULT_STATE
} from "../sponsor-forms-list-reducer";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  LOGOUT_USER: "LOGOUT_USER"
}));

function createInitialState(overrides = {}) {
  return { ...DEFAULT_STATE, ...overrides };
}

describe("sponsorFormsListReducer", () => {
  describe("RECEIVE_SUMMIT_SPONSORSHIP_TYPES", () => {
    const makePayload = (currentPage, data) => ({
      response: {
        current_page: currentPage,
        last_page: 3,
        total: 10,
        data
      }
    });

    it("replaces items on first page", () => {
      const state = createInitialState({
        sponsorships: {
          items: [{ id: 1, name: "Old" }],
          currentPage: 1,
          lastPage: 1,
          total: 1
        }
      });

      const result = sponsorFormsListReducer(state, {
        type: RECEIVE_SUMMIT_SPONSORSHIP_TYPES,
        payload: makePayload(1, [{ id: 2, type: { name: "Gold" } }])
      });

      expect(result.sponsorships.items).toStrictEqual([
        { id: 2, name: "Gold" }
      ]);
      expect(result.sponsorships.currentPage).toBe(1);
      expect(result.sponsorships.lastPage).toBe(3);
      expect(result.sponsorships.total).toBe(10);
    });

    it("appends items on subsequent pages", () => {
      const state = createInitialState({
        sponsorships: {
          items: [{ id: 1, name: "Gold" }],
          currentPage: 1,
          lastPage: 3,
          total: 10
        }
      });

      const result = sponsorFormsListReducer(state, {
        type: RECEIVE_SUMMIT_SPONSORSHIP_TYPES,
        payload: makePayload(2, [{ id: 2, type: { name: "Silver" } }])
      });

      expect(result.sponsorships.items).toStrictEqual([
        { id: 1, name: "Gold" },
        { id: 2, name: "Silver" }
      ]);
    });
  });
});
