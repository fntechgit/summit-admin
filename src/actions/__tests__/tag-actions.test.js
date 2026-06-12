/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  postRequest,
  putRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { getTags, saveTag } from "../tag-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  postRequest: jest.fn(),
  putRequest: jest.fn()
}));

const requestMock =
  (requestActionCreator, receiveActionCreator) => () => (dispatch) => {
    if (requestActionCreator && typeof requestActionCreator === "function") {
      dispatch(requestActionCreator({}));
    }
    return new Promise((resolve) => {
      if (typeof receiveActionCreator === "function") {
        dispatch(receiveActionCreator({ response: {} }));
      } else {
        dispatch(receiveActionCreator);
      }
      resolve({ response: {} });
    });
  };

describe("getTags", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(
      (requestAction, _receiveAction, _url, _errorHandler, payload) =>
        () =>
        (dispatch) => {
          dispatch(requestAction(payload));
          return Promise.resolve();
        }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("includes perPage in REQUEST_TAGS payload", async () => {
    const store = mockStore({});
    await store.dispatch(getTags("", 1, 25));

    const requestAction = store
      .getActions()
      .find((a) => a.type === "REQUEST_TAGS");
    expect(requestAction).toBeDefined();
    expect(requestAction.payload.perPage).toBe(25);
  });
});

describe("saveTag", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    postRequest.mockImplementation(requestMock);
    putRequest.mockImplementation(requestMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("create path (entity has no id)", () => {
    it("returns a Promise", () => {
      const store = mockStore({});
      const result = store.dispatch(saveTag({ tag: "test-tag" }));
      expect(result).toBeInstanceOf(Promise);
    });

    it("dispatches TAG_ADDED then STOP_LOADING on success", async () => {
      const store = mockStore({});
      store.dispatch(saveTag({ tag: "test-tag" }));
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("TAG_ADDED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("TAG_ADDED")
      );
    });
  });

  describe("update path (entity has id)", () => {
    it("returns a Promise", () => {
      const store = mockStore({});
      const result = store.dispatch(saveTag({ id: 1, tag: "test-tag" }));
      expect(result).toBeInstanceOf(Promise);
    });

    it("dispatches TAG_UPDATED then STOP_LOADING on success", async () => {
      const store = mockStore({});
      store.dispatch(saveTag({ id: 1, tag: "test-tag" }));
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("TAG_UPDATED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("TAG_UPDATED")
      );
    });
  });
});
