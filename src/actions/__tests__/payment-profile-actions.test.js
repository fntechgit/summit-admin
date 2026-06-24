import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getPaymentProfiles } from "../ticket-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

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
