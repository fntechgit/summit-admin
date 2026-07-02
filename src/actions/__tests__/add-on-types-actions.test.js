/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  putRequest,
  postRequest,
  deleteRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  getAddOnTypes,
  saveAddOnType,
  deleteAddOnType,
  resetAddOnTypeForm,
  REQUEST_ADD_ON_TYPES,
  RECEIVE_ADD_ON_TYPES,
  ADD_ON_TYPE_UPDATED,
  ADD_ON_TYPE_ADDED,
  RESET_ADD_ON_TYPE_FORM
} from "../add-on-types-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  postRequest: jest.fn(),
  deleteRequest: jest.fn()
}));

const requestMock =
  (requestActionCreator, receiveActionCreator) => () => (dispatch) => {
    if (requestActionCreator && typeof requestActionCreator === "function") {
      dispatch(requestActionCreator({}));
    }
    return new Promise((resolve) => {
      if (typeof receiveActionCreator === "function") {
        dispatch(receiveActionCreator({ response: { id: 1 } }));
      } else {
        dispatch(receiveActionCreator);
      }
      resolve({ response: { id: 1 } });
    });
  };

const rejectMock = () => () => () => Promise.reject(new Error("API error"));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("add-on-types actions", () => {
  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(requestMock);
    putRequest.mockImplementation(requestMock);
    postRequest.mockImplementation(requestMock);
    deleteRequest.mockImplementation(requestMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAddOnTypes", () => {
    it("dispatches REQUEST and RECEIVE actions on success", async () => {
      const store = mockStore({});
      store.dispatch(getAddOnTypes());
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_ADD_ON_TYPES);
      expect(types).toContain(RECEIVE_ADD_ON_TYPES);
    });

    it("passes page in the extra data payload so the reducer can track current page", async () => {
      let capturedExtra;
      getRequest.mockImplementation(
        (req, res, _url, _err, extra) => () => (dispatch) => {
          capturedExtra = extra;
          return requestMock(req, res)()(dispatch);
        }
      );

      const store = mockStore({});
      await store.dispatch(getAddOnTypes("foo", 2, 20, "name", -1));
      await flushPromises();

      expect(capturedExtra).toMatchObject({ page: 2, term: "foo" });
    });

    it("still dispatches STOP_LOADING when getRequest rejects", async () => {
      getRequest.mockImplementation(rejectMock);
      const store = mockStore({});
      await store.dispatch(getAddOnTypes()).catch(() => {});
      await flushPromises();

      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });
  });

  describe("saveAddOnType", () => {
    it("dispatches ADD_ON_TYPE_ADDED then STOP_LOADING when creating (no id)", async () => {
      const store = mockStore({});
      store.dispatch(saveAddOnType({ name: "VIP" }));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(ADD_ON_TYPE_ADDED);
      expect(types.indexOf("STOP_LOADING")).toBeGreaterThan(
        types.indexOf(ADD_ON_TYPE_ADDED)
      );
    });

    it("dispatches ADD_ON_TYPE_UPDATED then STOP_LOADING when updating (has id)", async () => {
      const store = mockStore({});
      store.dispatch(saveAddOnType({ id: 5, name: "VIP" }));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(ADD_ON_TYPE_UPDATED);
      expect(types.indexOf("STOP_LOADING")).toBeGreaterThan(
        types.indexOf(ADD_ON_TYPE_UPDATED)
      );
    });

    it("still dispatches STOP_LOADING when the request rejects", async () => {
      postRequest.mockImplementation(rejectMock);
      putRequest.mockImplementation(rejectMock);
      const store = mockStore({});
      await store.dispatch(saveAddOnType({ name: "VIP" })).catch(() => {});
      await flushPromises();

      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });
  });

  describe("deleteAddOnType", () => {
    it("dispatches STOP_LOADING on success", async () => {
      const store = mockStore({});
      store.dispatch(deleteAddOnType(7));
      await flushPromises();

      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });

    it("still dispatches STOP_LOADING when deleteRequest rejects", async () => {
      deleteRequest.mockImplementation(rejectMock);
      const store = mockStore({});
      await store.dispatch(deleteAddOnType(7)).catch(() => {});
      await flushPromises();

      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });
  });

  describe("resetAddOnTypeForm", () => {
    it("dispatches RESET_ADD_ON_TYPE_FORM", () => {
      const store = mockStore({});
      store.dispatch(resetAddOnTypeForm());

      expect(store.getActions().map((a) => a.type)).toContain(
        RESET_ADD_ON_TYPE_FORM
      );
    });
  });
});
