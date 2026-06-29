/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  postRequest,
  putRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { saveAdminAccess } from "../admin-access-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
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
        dispatch(receiveActionCreator({ response: { id: 1 } }));
      } else {
        dispatch(receiveActionCreator);
      }
      resolve({ response: { id: 1 } });
    });
  };

const rejectMock = () => () => () => Promise.reject(new Error("API error"));

describe("saveAdminAccess", () => {
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
    it("includes expand=members,summits in request params", async () => {
      let capturedParams;
      postRequest.mockImplementation((req, res) => (params) => (dispatch) => {
        capturedParams = params;
        return requestMock(req, res)(params)(dispatch);
      });

      const store = mockStore({});
      await store.dispatch(
        saveAdminAccess({ title: "Group A", members: [], summits: [] })
      );
      await flushPromises();

      expect(capturedParams).toMatchObject({ expand: "members,summits" });
    });

    it("returns a Promise", async () => {
      const store = mockStore({});
      const result = store.dispatch(
        saveAdminAccess({ title: "Group A", members: [], summits: [] })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it("dispatches ADMIN_ACCESS_ADDED then STOP_LOADING on success", async () => {
      const store = mockStore({});
      store.dispatch(
        saveAdminAccess({ title: "Group A", members: [], summits: [] })
      );
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("ADMIN_ACCESS_ADDED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("ADMIN_ACCESS_ADDED")
      );
    });

    it("still dispatches STOP_LOADING when postRequest rejects", async () => {
      postRequest.mockImplementation(rejectMock);
      const store = mockStore({});
      await store
        .dispatch(
          saveAdminAccess({ title: "Group A", members: [], summits: [] })
        )
        .catch(() => {});
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("STOP_LOADING");
    });
  });

  describe("update path (entity has id)", () => {
    it("includes expand=members,summits in request params", async () => {
      let capturedParams;
      putRequest.mockImplementation((req, res) => (params) => (dispatch) => {
        capturedParams = params;
        return requestMock(req, res)(params)(dispatch);
      });

      const store = mockStore({});
      await store.dispatch(
        saveAdminAccess({ id: 1, title: "Group A", members: [], summits: [] })
      );
      await flushPromises();

      expect(capturedParams).toMatchObject({ expand: "members,summits" });
    });

    it("returns a Promise", async () => {
      const store = mockStore({});
      const result = store.dispatch(
        saveAdminAccess({ id: 1, title: "Group A", members: [], summits: [] })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it("dispatches ADMIN_ACCESS_UPDATED then STOP_LOADING on success", async () => {
      const store = mockStore({});
      store.dispatch(
        saveAdminAccess({ id: 1, title: "Group A", members: [], summits: [] })
      );
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("ADMIN_ACCESS_UPDATED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("ADMIN_ACCESS_UPDATED")
      );
    });

    it("still dispatches STOP_LOADING when putRequest rejects", async () => {
      putRequest.mockImplementation(rejectMock);
      const store = mockStore({});
      await store
        .dispatch(
          saveAdminAccess({ id: 1, title: "Group A", members: [], summits: [] })
        )
        .catch(() => {});
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("STOP_LOADING");
    });
  });
});
