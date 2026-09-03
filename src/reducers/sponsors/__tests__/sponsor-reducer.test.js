import sponsorReducer, { DEFAULT_STATE } from "../sponsor-reducer";
import {
  UPDATE_SPONSOR,
  SPONSOR_UPDATED,
  SPONSOR_ADDED,
  RECEIVE_SPONSOR
} from "../../../actions/sponsor-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  LOGOUT_USER: "LOGOUT_USER"
}));

function createState(overrides = {}) {
  return {
    ...DEFAULT_STATE,
    entity: { ...DEFAULT_STATE.entity, ...overrides }
  };
}

describe("sponsorReducer", () => {
  describe("UPDATE_SPONSOR", () => {
    it("merges the payload into the existing entity instead of replacing it", () => {
      const state = createState({
        id: 5,
        is_published: false,
        company: { id: 9, name: "Acme" },
        header_image: "https://cdn.example.com/header.png"
      });

      const result = sponsorReducer(state, {
        type: UPDATE_SPONSOR,
        payload: { id: 5, is_published: true }
      });

      expect(result.entity.is_published).toBe(true);
      // fields not present on the payload (e.g. from a partial save) survive
      expect(result.entity.company).toEqual({ id: 9, name: "Acme" });
      expect(result.entity.header_image).toBe(
        "https://cdn.example.com/header.png"
      );
      expect(result.errors).toEqual({});
    });
  });

  describe.each([
    ["SPONSOR_UPDATED", SPONSOR_UPDATED],
    ["SPONSOR_ADDED", SPONSOR_ADDED],
    ["RECEIVE_SPONSOR", RECEIVE_SPONSOR]
  ])("%s", (_name, actionType) => {
    it("merges the server response into the existing entity", () => {
      const state = createState({
        id: 5,
        is_published: false,
        header_image: "https://cdn.example.com/header.png"
      });

      const result = sponsorReducer(state, {
        type: actionType,
        payload: {
          response: {
            id: 5,
            is_published: true,
            sponsorships: null,
            lead_report_setting: null
          }
        }
      });

      expect(result.entity.is_published).toBe(true);
      // untouched fields from the previous entity are preserved
      expect(result.entity.header_image).toBe(
        "https://cdn.example.com/header.png"
      );
    });

    it("normalizes null response fields to empty defaults", () => {
      const state = createState({ id: 5 });

      const result = sponsorReducer(state, {
        type: actionType,
        payload: {
          response: {
            id: 5,
            intro: null,
            sponsorships: null,
            lead_report_setting: null
          }
        }
      });

      expect(result.entity.intro).toBe("");
      expect(result.entity.sponsorships).toEqual([]);
      expect(result.entity.lead_report_setting).toEqual({});
    });
  });
});
