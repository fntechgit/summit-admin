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
  getPaymentProfiles,
  savePaymentProfile,
  deletePaymentFeeType
} from "../ticket-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  postRequest: jest.fn(),
  putRequest: jest.fn(),
  deleteRequest: jest.fn()
}));

// Shared mock factory for postRequest / putRequest / deleteRequest.
// Handles both function-style and pre-invoked action objects in the 2nd arg.
const mockWriteImpl =
  (mockResponse = { id: 1 }) =>
  (reqAC, recAC) =>
  () =>
  (dispatch) => {
    if (reqAC != null) {
      if (typeof reqAC === "function") dispatch(reqAC({}));
      else dispatch(reqAC);
    }
    return Promise.resolve().then(() => {
      if (typeof recAC === "function")
        dispatch(recAC({ response: mockResponse }));
      else dispatch(recAC);
    });
  };

describe("getPaymentProfiles", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const SUMMIT_ID = 42;
  let store;
  let capturedParams;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedParams = null;
    store = mockStore({
      currentSummitState: { currentSummit: { id: SUMMIT_ID } }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    window.PURCHASES_API_URL = "https://purchases.example.com";

    getRequest.mockImplementation(
      (reqAC, recAC, url, errHandler, extraPayload) => (params) => {
        capturedParams = params;
        return (dispatch) => {
          dispatch(reqAC(extraPayload || {}));
          return Promise.resolve().then(() => {
            dispatch(
              recAC({
                response: {
                  data: [],
                  total: 0,
                  current_page: 1,
                  last_page: 1
                }
              })
            );
          });
        };
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  test("dispatches START_LOADING, REQUEST, RECEIVE, STOP_LOADING", async () => {
    store.dispatch(getPaymentProfiles());
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types).toEqual([
      "START_LOADING",
      "REQUEST_PAYMENT_PROFILES",
      "RECEIVE_PAYMENT_PROFILES",
      "STOP_LOADING"
    ]);
    expect(getRequest).toHaveBeenCalledTimes(1);
  });

  test("builds correct summit URL", async () => {
    store.dispatch(getPaymentProfiles());
    await flushPromises();

    const url = getRequest.mock.calls[0][2];
    expect(url).toBe(
      `https://purchases.example.com/api/v1/summits/${SUMMIT_ID}/payment-profiles`
    );
  });

  test.each(["", undefined])("omits filter[] when term is %p", async (term) => {
    store.dispatch(getPaymentProfiles(term));
    await flushPromises();

    expect(capturedParams).not.toHaveProperty("filter[]");
  });

  test("adds provider and application_type string filters for non-numeric term", async () => {
    store.dispatch(getPaymentProfiles("stripe"));
    await flushPromises();

    expect(capturedParams["filter[]"]).toEqual([
      "provider=@stripe,application_type=@stripe"
    ]);
  });

  test("adds exact-match id filter alongside string filters for numeric term", async () => {
    store.dispatch(getPaymentProfiles("42"));
    await flushPromises();

    expect(capturedParams["filter[]"]).toEqual([
      "provider=@42,application_type=@42,id==42"
    ]);
  });

  test.each([
    ["foo,bar", "provider=@foo\\,bar,application_type=@foo\\,bar"],
    ["foo;bar", "provider=@foo\\;bar,application_type=@foo\\;bar"]
  ])(
    "escapeFilterValue escapes special chars in %p",
    async (term, expected) => {
      store.dispatch(getPaymentProfiles(term));
      await flushPromises();

      expect(capturedParams["filter[]"]).toEqual([expected]);
    }
  );

  test("REQUEST_PAYMENT_PROFILES payload includes term, page, perPage, order, orderDir", async () => {
    store.dispatch(getPaymentProfiles("stripe", 2, 25, "provider", 0));
    await flushPromises();

    const extraPayload = getRequest.mock.calls[0][4];
    expect(extraPayload).toEqual({
      term: "stripe",
      page: 2,
      perPage: 25,
      order: "provider",
      orderDir: 0
    });
  });

  test("params include access_token, page, and per_page", async () => {
    store.dispatch(getPaymentProfiles("", 3, 20));
    await flushPromises();

    expect(capturedParams).toMatchObject({
      access_token: "TOKEN",
      page: 3,
      per_page: 20
    });
  });

  test.each([
    [1, "+provider"],
    [0, "-provider"]
  ])(
    "order param uses correct prefix for orderDir %i",
    async (orderDir, expected) => {
      store.dispatch(getPaymentProfiles("", 1, 10, "provider", orderDir));
      await flushPromises();

      expect(capturedParams.order).toBe(expected);
    }
  );
});

describe("savePaymentProfile", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const SUMMIT_ID = 42;
  const NEW_PROFILE = {
    id: 0,
    application_type: "Registration",
    provider: "Stripe"
  };
  const EXISTING_PROFILE = {
    id: 5,
    application_type: "SponsorServices",
    provider: "Stripe"
  };
  const API_RESPONSE = {
    id: 5,
    application_type: "SponsorServices",
    provider: "Stripe"
  };
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      currentSummitState: { currentSummit: { id: SUMMIT_ID } }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    window.PURCHASES_API_URL = "https://purchases.example.com";
    postRequest.mockImplementation(mockWriteImpl(API_RESPONSE));
    putRequest.mockImplementation(mockWriteImpl(API_RESPONSE));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  test("POST path: dispatches START_LOADING, UPDATE_PAYMENT_PROFILE, PAYMENT_PROFILE_ADDED, SET_SNACKBAR_MESSAGE, STOP_LOADING", async () => {
    store.dispatch(savePaymentProfile(NEW_PROFILE));
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types).toEqual([
      "START_LOADING",
      "UPDATE_PAYMENT_PROFILE",
      "PAYMENT_PROFILE_ADDED",
      "SET_SNACKBAR_MESSAGE",
      "STOP_LOADING"
    ]);
    expect(postRequest).toHaveBeenCalledTimes(1);
    expect(putRequest).not.toHaveBeenCalled();
  });

  test("POST path: uses correct summit URL without entity id", async () => {
    store.dispatch(savePaymentProfile(NEW_PROFILE));
    await flushPromises();

    const url = postRequest.mock.calls[0][2];
    expect(url).toBe(
      `https://purchases.example.com/api/v1/summits/${SUMMIT_ID}/payment-profiles`
    );
  });

  test("POST path: sends entity as request body", async () => {
    store.dispatch(savePaymentProfile(NEW_PROFILE));
    await flushPromises();

    expect(postRequest.mock.calls[0][3]).toEqual(NEW_PROFILE);
  });

  test("PUT path: dispatches START_LOADING, UPDATE_PAYMENT_PROFILE, PAYMENT_PROFILE_UPDATED, SET_SNACKBAR_MESSAGE, STOP_LOADING", async () => {
    store.dispatch(savePaymentProfile(EXISTING_PROFILE));
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types).toEqual([
      "START_LOADING",
      "UPDATE_PAYMENT_PROFILE",
      "PAYMENT_PROFILE_UPDATED",
      "SET_SNACKBAR_MESSAGE",
      "STOP_LOADING"
    ]);
    expect(putRequest).toHaveBeenCalledTimes(1);
    expect(postRequest).not.toHaveBeenCalled();
  });

  test("PUT path: uses correct summit URL with entity id", async () => {
    store.dispatch(savePaymentProfile(EXISTING_PROFILE));
    await flushPromises();

    const url = putRequest.mock.calls[0][2];
    expect(url).toBe(
      `https://purchases.example.com/api/v1/summits/${SUMMIT_ID}/payment-profiles/${EXISTING_PROFILE.id}`
    );
  });

  test("PUT path: sends entity as request body", async () => {
    store.dispatch(savePaymentProfile(EXISTING_PROFILE));
    await flushPromises();

    expect(putRequest.mock.calls[0][3]).toEqual(EXISTING_PROFILE);
  });

  test("STOP_LOADING is dispatched even when the request fails", async () => {
    putRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("network error"))
    );
    store.dispatch(savePaymentProfile(EXISTING_PROFILE)).catch(() => {});
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain("START_LOADING");
    expect(types).toContain("STOP_LOADING");
    expect(types).not.toContain("PAYMENT_PROFILE_UPDATED");
  });
});

describe("deletePaymentFeeType", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const SUMMIT_ID = 42;
  const PROFILE_ID = 7;
  const FEE_TYPE_ID = 3;
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      currentSummitState: { currentSummit: { id: SUMMIT_ID } },
      currentPaymentProfileState: { entity: { id: PROFILE_ID } }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    window.PURCHASES_API_URL = "https://purchases.example.com";
    deleteRequest.mockImplementation(mockWriteImpl());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.PURCHASES_API_URL;
  });

  test("dispatches PAYMENT_FEE_TYPE_DELETED with correct id and STOP_LOADING on success", async () => {
    store.dispatch(deletePaymentFeeType(FEE_TYPE_ID));
    await flushPromises();

    const actions = store.getActions();
    const types = actions.map((a) => a.type);
    expect(types).toContain("PAYMENT_FEE_TYPE_DELETED");
    expect(types).toContain("STOP_LOADING");

    const deleted = actions.find((a) => a.type === "PAYMENT_FEE_TYPE_DELETED");
    expect(deleted.payload).toEqual({ paymentFeeTypeId: FEE_TYPE_ID });
  });

  test("does not dispatch START_LOADING (pre-existing gap: loading spinner not shown during delete)", async () => {
    store.dispatch(deletePaymentFeeType(FEE_TYPE_ID));
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types).not.toContain("START_LOADING");
  });

  test("uses correct URL with summit id, profile id, and fee type id", async () => {
    store.dispatch(deletePaymentFeeType(FEE_TYPE_ID));
    await flushPromises();

    const url = deleteRequest.mock.calls[0][2];
    expect(url).toBe(
      `https://purchases.example.com/api/v1/summits/${SUMMIT_ID}/payment-profiles/${PROFILE_ID}/fee-types/${FEE_TYPE_ID}`
    );
  });
});
