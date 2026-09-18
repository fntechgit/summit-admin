/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  postRequest,
  putRequest,
  getRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { saveSelectionPlan, getSelectionPlan } from "../selection-plan-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn(),
  putRequest: jest.fn(),
  getRequest: jest.fn()
}));

jest.mock("../marketing-actions", () => ({
  saveMarketingSetting: jest.fn()
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

const storeState = {
  currentSummitState: { currentSummit: { id: 1 } }
};

describe("saveSelectionPlan", () => {
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
    it("returns a Promise that resolves with the response payload", async () => {
      const store = mockStore(storeState);
      const result = store.dispatch(
        saveSelectionPlan({ name: "CFP 2026", is_enabled: true })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toEqual({ id: 1 });
    });

    it("dispatches SELECTION_PLAN_ADDED then STOP_LOADING on success", async () => {
      const store = mockStore(storeState);
      store.dispatch(saveSelectionPlan({ name: "CFP 2026", is_enabled: true }));
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("SELECTION_PLAN_ADDED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("SELECTION_PLAN_ADDED")
      );
    });

    it("dispatches a success SET_SNACKBAR_MESSAGE on save", async () => {
      const store = mockStore(storeState);
      store.dispatch(saveSelectionPlan({ name: "CFP 2026", is_enabled: true }));
      await flushPromises();

      const snackbarAction = store
        .getActions()
        .find((a) => a.type === "SET_SNACKBAR_MESSAGE");
      expect(snackbarAction).toBeDefined();
      expect(snackbarAction.payload).toMatchObject({
        type: "success",
        code: 200
      });
    });
  });

  describe("update path (entity has id)", () => {
    it("returns a Promise that resolves with the response payload", async () => {
      const store = mockStore(storeState);
      const result = store.dispatch(
        saveSelectionPlan({ id: 1, name: "CFP 2026", is_enabled: true })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toEqual({ id: 1 });
    });

    it("dispatches SELECTION_PLAN_UPDATED then STOP_LOADING on success", async () => {
      const store = mockStore(storeState);
      store.dispatch(
        saveSelectionPlan({ id: 1, name: "CFP 2026", is_enabled: true })
      );
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("SELECTION_PLAN_UPDATED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("SELECTION_PLAN_UPDATED")
      );
    });

    it("dispatches a success SET_SNACKBAR_MESSAGE on save", async () => {
      const store = mockStore(storeState);
      store.dispatch(
        saveSelectionPlan({ id: 1, name: "CFP 2026", is_enabled: true })
      );
      await flushPromises();

      const snackbarAction = store
        .getActions()
        .find((a) => a.type === "SET_SNACKBAR_MESSAGE");
      expect(snackbarAction).toBeDefined();
      expect(snackbarAction.payload).toMatchObject({
        type: "success",
        code: 200
      });
    });
  });
});

describe("getSelectionPlan - stale response guard", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  // Only the primary "/selection-plans/{id}" fetch is held open (its
  // resolution order is controlled from the test); the allowed-members and
  // progress-flags follow-up calls resolve immediately so `await`s in
  // getSelectionPlan don't hang.
  const isPrimaryFetchUrl = (url) => /\/selection-plans\/[^/]+$/.test(url);

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("drops an older plan's response after a newer plan's response already landed", async () => {
    const resolvers = {};
    getRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator, url) => () => (dispatch) => {
        if (isPrimaryFetchUrl(url)) {
          const id = Number(url.split("/").pop());
          return new Promise((resolve) => {
            resolvers[id] = () => {
              dispatch(receiveActionCreator({ response: { id } }));
              resolve();
            };
          });
        }
        if (requestActionCreator) dispatch(requestActionCreator({}));
        dispatch(receiveActionCreator({ response: {} }));
        return Promise.resolve();
      }
    );

    const store = mockStore(storeState);

    // User opens plan 5, then quickly navigates to plan 8 before plan 5's
    // fetch settles - both requests are genuinely in flight when plan 8's
    // response lands first.
    store.dispatch(getSelectionPlan("5"));
    await flushPromises();
    store.dispatch(getSelectionPlan("8"));
    await flushPromises();

    // The newer request (plan 8) resolves first...
    resolvers[8]();
    await flushPromises();

    // ...then the older, superseded request (plan 5) resolves late.
    resolvers[5]();
    await flushPromises();

    const receivedIds = store
      .getActions()
      .filter((a) => a.type === "RECEIVE_SELECTION_PLAN")
      .map((a) => a.payload.response.id);

    // Plan 5's stale response must never reach the store - only plan 8's.
    expect(receivedIds).toEqual([8]);
  });
});
