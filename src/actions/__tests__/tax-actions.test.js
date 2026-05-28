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
import { saveTaxType } from "../tax-actions";
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
        dispatch(receiveActionCreator({ response: {} }));
      } else {
        dispatch(receiveActionCreator);
      }
      resolve({ response: {} });
    });
  };

const storeState = {
  currentSummitState: { currentSummit: { id: 1 } }
};

describe("saveTaxType", () => {
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
        saveTaxType({ name: "VAT", rate: 20, tax_id: "V1" })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toEqual({ response: {} });
    });

    it("dispatches TAX_TYPE_ADDED then STOP_LOADING on success", async () => {
      const store = mockStore(storeState);
      store.dispatch(saveTaxType({ name: "VAT", rate: 20, tax_id: "V1" }));
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("TAX_TYPE_ADDED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("TAX_TYPE_ADDED")
      );
    });
  });

  describe("update path (entity has id)", () => {
    it("returns a Promise that resolves with the response payload", async () => {
      const store = mockStore(storeState);
      const result = store.dispatch(
        saveTaxType({ id: 1, name: "VAT", rate: 20, tax_id: "V1" })
      );
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toEqual({ response: {} });
    });

    it("dispatches TAX_TYPE_UPDATED then STOP_LOADING on success", async () => {
      const store = mockStore(storeState);
      store.dispatch(
        saveTaxType({ id: 1, name: "VAT", rate: 20, tax_id: "V1" })
      );
      await flushPromises();

      const actionTypes = store.getActions().map((a) => a.type);
      expect(actionTypes).toContain("TAX_TYPE_UPDATED");
      expect(actionTypes).toContain("STOP_LOADING");
      expect(actionTypes.indexOf("STOP_LOADING")).toBeGreaterThan(
        actionTypes.indexOf("TAX_TYPE_UPDATED")
      );
    });
  });
});
