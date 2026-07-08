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
import { saveSelectionPlan } from "../selection-plan-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn(),
  putRequest: jest.fn()
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
