/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  getSponsorForms,
  normalizeFormTemplate,
  normalizeSponsorCustomizedForm,
  updateFormTemplateTiers,
  removeItemFile,
  removeSponsorCustomizedFormItemImages,
  saveSponsorFormItem,
  updateSponsorFormItem
} from "../sponsor-forms-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn(),
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  deleteRequest: jest.fn()
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
            showArchived: false,
            order: "id",
            orderDir: 1,
            page: 2,
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
      getRequest.mockClear();

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
          showArchived: false
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
          showArchived: false,
          order: "name",
          orderDir: -1,
          page: 3,
          perPage: 25,
          term: "expo"
        }
      );
    });
  });

  describe("removeItemFile", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

      deleteRequest.mockImplementation(
        (requestActionCreator, receiveAction) => () => (dispatch) => {
          if (typeof receiveAction === "function") {
            dispatch(receiveAction({ response: {} }));
          } else {
            dispatch(receiveAction);
          }
          return Promise.resolve({ response: {} });
        }
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("dispatches SPONSOR_FORM_ITEM_FILE_DELETED with fileId and itemId", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 42 } }
      });

      store.dispatch(removeItemFile(7, 99, 555));
      await flushPromises();

      expect(deleteRequest).toHaveBeenCalledWith(
        null,
        {
          type: "SPONSOR_FORM_ITEM_FILE_DELETED",
          payload: { fileId: 555, itemId: 99 }
        },
        `${window.PURCHASES_API_URL}/api/v1/summits/42/show-forms/7/items/99/images/555`,
        null,
        expect.any(Function)
      );

      const dispatched = store
        .getActions()
        .find((a) => a.type === "SPONSOR_FORM_ITEM_FILE_DELETED");
      expect(dispatched.payload).toEqual({ fileId: 555, itemId: 99 });
    });
  });

  describe("removeSponsorCustomizedFormItemImages", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

      deleteRequest.mockImplementation(
        (requestActionCreator, receiveAction) => () => (dispatch) => {
          if (typeof receiveAction === "function") {
            dispatch(receiveAction({ response: {} }));
          } else {
            dispatch(receiveAction);
          }
          return Promise.resolve({ response: {} });
        }
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("dispatches SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED with fileId and itemId", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 42 } },
        currentSponsorState: { entity: { id: 5 } }
      });

      store.dispatch(removeSponsorCustomizedFormItemImages(7, 99, 555));
      await flushPromises();

      expect(deleteRequest).toHaveBeenCalledWith(
        null,
        {
          type: "SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED",
          payload: { fileId: 555, itemId: 99 }
        },
        `${window.PURCHASES_API_URL}/api/v1/summits/42/sponsors/5/sponsor-forms/7/items/99/images/555`,
        null,
        expect.any(Function)
      );

      const dispatched = store
        .getActions()
        .find((a) => a.type === "SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED");
      expect(dispatched.payload).toEqual({ fileId: 555, itemId: 99 });
    });
  });

  describe("saveSponsorFormItem", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

      postRequest.mockImplementation(
        () => () => () => Promise.resolve({ response: { id: 100 } })
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("sends the images in the create request body and makes no follow-up image request", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 42 } }
      });

      const entity = {
        name: "Item",
        images: [{ file_path: "data:image/png;base64,AAA" }],
        meta_fields: []
      };

      await store.dispatch(saveSponsorFormItem(7, entity));
      await flushPromises();

      expect(postRequest).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        `${window.PURCHASES_API_URL}/api/v1/summits/42/show-forms/7/items`,
        expect.objectContaining({
          images: [{ file_path: "data:image/png;base64,AAA" }]
        }),
        expect.any(Function)
      );

      // The item-create request itself now saves and associates the
      // images — a follow-up per-image request would create duplicates.
      const hitImagesEndpoint = postRequest.mock.calls.some(([, , url]) =>
        url.includes("/images")
      );
      expect(hitImagesEndpoint).toBe(false);
    });
  });

  describe("updateSponsorFormItem", () => {
    const middlewares = [thunk];
    const mockStore = configureStore(middlewares);

    beforeEach(() => {
      jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");

      putRequest.mockImplementation(
        () => () => () => Promise.resolve({ response: { id: 100 } })
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("sends the images in the update request body and makes no follow-up image request", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 42 } }
      });

      const entity = {
        id: 100,
        name: "Item",
        images: [{ id: 5, file_path: "https://cdn/a.png" }],
        meta_fields: []
      };

      await store.dispatch(updateSponsorFormItem(7, entity));
      await flushPromises();

      expect(putRequest).toHaveBeenCalledWith(
        null,
        expect.any(Function),
        `${window.PURCHASES_API_URL}/api/v1/summits/42/show-forms/7/items/100`,
        expect.objectContaining({
          images: [{ id: 5, file_path: "https://cdn/a.png" }]
        }),
        expect.any(Function)
      );

      // The item-update request itself now saves and associates the
      // images — a follow-up per-image request would create duplicates.
      const hitImagesEndpoint = putRequest.mock.calls.some(([, , url]) =>
        url.includes("/images")
      );
      expect(hitImagesEndpoint).toBe(false);
    });
  });
});
