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
import { saveEmailTemplate } from "../email-actions";
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

describe("saveEmailTemplate", () => {
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
    it("returns a Promise", async () => {
      const store = mockStore({});
      const result = store.dispatch(
        saveEmailTemplate({ identifier: "test-template" })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it("dispatches TEMPLATE_ADDED then STOP_LOADING on success", async () => {
      const store = mockStore({});
      store.dispatch(saveEmailTemplate({ identifier: "test-template" }));
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("TEMPLATE_ADDED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("TEMPLATE_ADDED")
      );
    });
  });

  describe("update path (entity has id)", () => {
    it("returns a Promise", async () => {
      const store = mockStore({});
      const result = store.dispatch(
        saveEmailTemplate({ id: 1, identifier: "test-template" })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it("dispatches TEMPLATE_UPDATED then STOP_LOADING on success", async () => {
      const store = mockStore({});
      store.dispatch(saveEmailTemplate({ id: 1, identifier: "test-template" }));
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("TEMPLATE_UPDATED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("TEMPLATE_UPDATED")
      );
    });
  });
});
