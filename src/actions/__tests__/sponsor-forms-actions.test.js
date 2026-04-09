/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  putRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  getSponsorForms,
  normalizeFormTemplate,
  normalizeSponsorCustomizedForm,
  updateFormTemplateTiers
} from "../sponsor-forms-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn(),
  getRequest: jest.fn(),
  putRequest: jest.fn()
}));

describe("Sponsor Forms Actions", () => {
  describe("GetSponsorForms", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

      getRequest.mockImplementation((...requestArgs) => {
        const [requestActionCreator, receiveActionCreator] = requestArgs;
        const requestActionPayload = requestArgs[5] ?? {};

        return () => (dispatch) => {
          if (
            requestActionCreator &&
            typeof requestActionCreator === "function"
          )
            dispatch(requestActionCreator(requestActionPayload));

          return new Promise((resolve) => {
            if (typeof receiveActionCreator === "function") {
              dispatch(receiveActionCreator({ response: {} }));
              resolve({ response: {} });
            }
            dispatch(receiveActionCreator);
            resolve({ response: {} });
          });
        };
      });
    });

    afterEach(() => {
      // restore the spy created with spyOn
      jest.restoreAllMocks();
    });
    describe("On perPage change", () => {
      it("should request page specified", async () => {
        const store = mockStore({
          currentSummitState: {
            currentSummit: {}
          },
          sponsorFormsListState: {
            totalCount: 13
          }
        });

        store.dispatch(getSponsorForms("", 2, 50, "id", 1, false, []));
        await flushPromises();

        expect(getRequest).toHaveBeenCalled();
        expect(getRequest).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          {
            hideArchived: false,
            order: "id",
            orderDir: 1,
            currentPage: 2,
            perPage: 50,
            term: ""
          }
        );
      });
    });
  });

  describe("normalizeFormTemplate", () => {
    it("should set sponsorship_types to empty array when 'all' is selected", () => {
      const entity = {
        opens_at: "2026-01-01 10:00:00",
        expires_at: "2026-12-31 23:59:59",
        sponsorship_types: ["all", 1, 2],
        meta_fields: [{ name: "field1" }, { name: "" }]
      };

      const result = normalizeFormTemplate(entity, "UTC");

      expect(result.apply_to_all_types).toBe(true);
      expect(result.sponsorship_types).toEqual([]);
      expect(typeof result.opens_at).toBe("number");
      expect(typeof result.expires_at).toBe("number");
      expect(result.meta_fields).toHaveLength(1);
    });

    it("should preserve sponsorship_types array when specific types are selected", () => {
      const entity = {
        opens_at: "2026-01-01 10:00:00",
        expires_at: "2026-12-31 23:59:59",
        sponsorship_types: [1, 2, 3],
        meta_fields: [{ name: "field1" }]
      };

      const result = normalizeFormTemplate(entity, "UTC");

      expect(result.apply_to_all_types).toBe(false);
      expect(result.sponsorship_types).toEqual([1, 2, 3]);
    });

    it("should handle empty sponsorship_types array", () => {
      const entity = {
        opens_at: "2026-01-01 10:00:00",
        expires_at: "2026-12-31 23:59:59",
        sponsorship_types: [],
        meta_fields: []
      };

      const result = normalizeFormTemplate(entity, "UTC");

      expect(result.apply_to_all_types).toBe(false);
      expect(result.sponsorship_types).toEqual([]);
    });
  });

  describe("normalizeSponsorCustomizedForm", () => {
    it("should set allowed_add_ons to empty array when 'all' is selected", () => {
      const entity = {
        id: 1,
        code: "TEST",
        name: "Test Form",
        opens_at: "2026-01-01 10:00:00",
        expires_at: "2026-12-31 23:59:59",
        allowed_add_ons: ["all", { id: 1 }, { id: 2 }],
        meta_fields: [{ name: "field1" }, { name: "" }]
      };

      const result = normalizeSponsorCustomizedForm(entity, "UTC");

      expect(result.apply_to_all_add_ons).toBe(true);
      expect(result.allowed_add_ons).toEqual([]);
      expect(typeof result.opens_at).toBe("number");
      expect(typeof result.expires_at).toBe("number");
      expect(result.meta_fields).toHaveLength(1);
      expect(result.id).toBeUndefined();
    });

    it("should map allowed_add_ons to IDs when specific add-ons are selected", () => {
      const entity = {
        id: 1,
        opens_at: "2026-01-01 10:00:00",
        expires_at: "2026-12-31 23:59:59",
        allowed_add_ons: [{ id: 1 }, { id: 2 }, { id: 3 }],
        meta_fields: [{ name: "field1" }]
      };

      const result = normalizeSponsorCustomizedForm(entity, "UTC");

      expect(result.apply_to_all_add_ons).toBe(false);
      expect(result.allowed_add_ons).toEqual([1, 2, 3]);
    });

    it("should handle empty allowed_add_ons array", () => {
      const entity = {
        id: 1,
        opens_at: "2026-01-01 10:00:00",
        expires_at: "2026-12-31 23:59:59",
        allowed_add_ons: [],
        meta_fields: []
      };

      const result = normalizeSponsorCustomizedForm(entity, "UTC");

      expect(result.apply_to_all_add_ons).toBe(false);
      expect(result.allowed_add_ons).toEqual([]);
    });
  });

  describe("updateFormTemplateTiers", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

      putRequest.mockImplementation((...requestArgs) => {
        const [, receiveActionCreator] = requestArgs;

        return () => (dispatch) => {
          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response: {} }));
          }
          return Promise.resolve({ response: {} });
        };
      });

      getRequest.mockImplementation((...requestArgs) => {
        const [requestActionCreator, receiveActionCreator] = requestArgs;
        const requestActionPayload = requestArgs[5] ?? {};

        return () => (dispatch) => {
          if (
            requestActionCreator &&
            typeof requestActionCreator === "function"
          ) {
            dispatch(requestActionCreator(requestActionPayload));
          }

          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response: {} }));
          }

          return Promise.resolve({ response: {} });
        };
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should update tiers and refetch sponsor forms preserving current list params", async () => {
      const store = mockStore({
        currentSummitState: {
          currentSummit: { id: 99 }
        },
        sponsorFormsListState: {
          term: "expo",
          currentPage: 3,
          perPage: 25,
          order: "name",
          orderDir: -1,
          hideArchived: true
        }
      });

      store.dispatch(
        updateFormTemplateTiers({
          id: 77,
          sponsorship_types: [1, 2],
          apply_to_all_types: false
        })
      );

      await flushPromises();

      expect(putRequest).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        `${window.PURCHASES_API_URL}/api/v1/summits/99/show-forms/77`,
        {
          apply_to_all_types: false,
          sponsorship_types: [1, 2]
        },
        expect.any(Function)
      );

      expect(getRequest).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        `${window.PURCHASES_API_URL}/api/v1/summits/99/show-forms`,
        expect.any(Function),
        {
          hideArchived: true,
          order: "name",
          orderDir: -1,
          currentPage: 3,
          perPage: 25,
          term: "expo"
        }
      );
    });
  });
});
