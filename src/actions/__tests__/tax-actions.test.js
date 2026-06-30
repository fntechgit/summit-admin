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
import { getTaxTypes, saveTaxType } from "../tax-actions";
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

const storeState = {
  currentSummitState: { currentSummit: { id: 1 } }
};

describe("getTaxTypes", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  let capturedParams;

  beforeEach(() => {
    window.API_BASE_URL = "https://api.example.com";
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(
      (requestAction, _receiveAction, _url, _errorHandler, payload) =>
        (params) =>
        (dispatch) => {
          capturedParams = params;
          if (typeof requestAction === "function") {
            dispatch(requestAction(payload));
          }
          return Promise.resolve();
        }
    );
  });

  afterEach(() => {
    delete window.API_BASE_URL;
    jest.restoreAllMocks();
  });

  it("sends page and per_page from arguments", async () => {
    const store = mockStore(storeState);
    await store.dispatch(getTaxTypes("", 2, 25));
    expect(capturedParams.page).toBe(2);
    expect(capturedParams.per_page).toBe(25);
  });

  it("does not include filter[] when term is empty", async () => {
    const store = mockStore(storeState);
    await store.dispatch(getTaxTypes("", 1, 10));
    expect(capturedParams["filter[]"]).toBeUndefined();
  });

  it("includes name filter when term is provided", async () => {
    const store = mockStore(storeState);
    await store.dispatch(getTaxTypes("VAT", 1, 10));
    expect(capturedParams["filter[]"]).toEqual(["name=@VAT"]);
  });

  it("builds ascending order param with + prefix for orderDir 1", async () => {
    const store = mockStore(storeState);
    await store.dispatch(getTaxTypes("", 1, 10, "name", 1));
    expect(capturedParams.order).toBe("+name");
  });

  it("builds descending order param with - prefix for orderDir other than 1", async () => {
    const store = mockStore(storeState);
    await store.dispatch(getTaxTypes("", 1, 10, "rate", -1));
    expect(capturedParams.order).toBe("-rate");
  });

  it("dispatches REQUEST_TAX_TYPES with pagination, sort and term in payload", async () => {
    const store = mockStore(storeState);
    await store.dispatch(getTaxTypes("test", 3, 20, "rate", -1));
    const requestAction = store
      .getActions()
      .find((a) => a.type === "REQUEST_TAX_TYPES");
    expect(requestAction).toBeDefined();
    expect(requestAction.payload).toMatchObject({
      page: 3,
      perPage: 20,
      order: "rate",
      orderDir: -1,
      term: "test"
    });
  });

  it("dispatches STOP_LOADING after the request completes", async () => {
    const store = mockStore(storeState);
    await store.dispatch(getTaxTypes());
    const actionTypes = store.getActions().map((a) => a.type);
    expect(actionTypes).toContain("STOP_LOADING");
  });
});

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
