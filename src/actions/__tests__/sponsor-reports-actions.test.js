import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { doLogin } from "openstack-uicore-foundation/lib/security/methods";
import * as methods from "../../utils/methods";
import { makeReadErrorHandler } from "../../utils/report-errors";

import {
  getPurchaseDetailsReport,
  getPurchaseDetailsFilters,
  getSponsorAssetReport,
  getSponsorAssetFilters,
  getSponsorAssetSponsor,
  REQUEST_PURCHASE_DETAILS,
  RECEIVE_PURCHASE_DETAILS,
  RECEIVE_PURCHASE_DETAILS_FILTERS,
  PURCHASE_DETAILS_READ_ERROR,
  PURCHASE_DETAILS_VALIDATION_ERROR,
  REQUEST_SPONSOR_ASSET,
  RECEIVE_SPONSOR_ASSET,
  RECEIVE_SPONSOR_ASSET_FILTERS,
  SPONSOR_ASSET_READ_ERROR,
  REQUEST_SPONSOR_DRILLDOWN,
  RECEIVE_SPONSOR_DRILLDOWN,
  SPONSOR_DRILLDOWN_READ_ERROR
} from "../sponsor-reports-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/security/methods", () => ({
  doLogin: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/methods"),
  getBackURL: jest.fn(() => "/back")
}));

const MOCK_STATE = {
  currentSummitState: { currentSummit: { id: 42 } }
};

describe("sponsor-reports-actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  let capturedUrl = null;
  let capturedParams = null;

  function makeHappyGetRequest() {
    return getRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator, url) =>
        (params = {}) =>
        (dispatch) => {
          capturedUrl = url;
          capturedParams = params;

          if (
            requestActionCreator &&
            typeof requestActionCreator === "function"
          ) {
            dispatch(requestActionCreator({}));
          }

          return new Promise((resolve) => {
            if (typeof receiveActionCreator === "function") {
              dispatch(
                receiveActionCreator({
                  response: {
                    data: [],
                    total: 0,
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    summary: null
                  }
                })
              );
            }
            resolve({ response: {} });
          });
        }
    );
  }

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockClear();
    doLogin.mockClear();
    capturedUrl = null;
    capturedParams = null;
    makeHappyGetRequest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    capturedUrl = null;
    capturedParams = null;
  });

  // ─── getPurchaseDetailsReport ────────────────────────────────────────────────

  describe("getPurchaseDetailsReport", () => {
    it("dispatches REQUEST_PURCHASE_DETAILS then RECEIVE_PURCHASE_DETAILS", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport({ page: 1 }));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_PURCHASE_DETAILS);
      expect(types).toContain(RECEIVE_PURCHASE_DETAILS);
    });

    it("uses summit id from currentSummitState (not a passed param)", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport());
      await flushPromises();

      expect(capturedUrl).toContain("/summits/42/");
    });

    it("passes access_token and spread query in params", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport({ page: 2, per_page: 25 }));
      await flushPromises();

      expect(capturedParams.access_token).toBe("TOKEN");
      expect(capturedParams.page).toBe(2);
      expect(capturedParams.per_page).toBe(25);
    });

    it("503 export-disabled on read dispatches PURCHASE_DETAILS_READ_ERROR (clears loading)", async () => {
      // Simulate getRequest invoking the error handler with a 503 export-disabled response.
      getRequest.mockImplementation(
        (requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          if (requestAC) dispatch(requestAC({}));
          errorHandler(
            {
              status: 503,
              response: {
                body: { message: "CSV export is not enabled for this summit" }
              }
            },
            {}
          )(dispatch);
          return Promise.resolve();
        }
      );

      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport({ page: 1 }));
      await flushPromises();

      const actions = store.getActions();
      const types = actions.map((a) => a.type);
      expect(types).toContain(REQUEST_PURCHASE_DETAILS);
      // export-disabled must dispatch the loading-clearing READ_ERROR action.
      expect(types).toContain(PURCHASE_DETAILS_READ_ERROR);
      // payload carries the full { kind, status, message } shape (consistent
      // with the other error branches).
      const readErr = actions.find(
        (a) => a.type === PURCHASE_DETAILS_READ_ERROR
      );
      expect(readErr.payload).toMatchObject({
        kind: "export-disabled",
        status: 503
      });
    });
  });

  // ─── getPurchaseDetailsFilters ───────────────────────────────────────────────

  describe("getPurchaseDetailsFilters", () => {
    it("dispatches RECEIVE_PURCHASE_DETAILS_FILTERS", async () => {
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator, url) =>
          (params = {}) =>
          (dispatch) => {
            capturedUrl = url;
            capturedParams = params;
            return new Promise((resolve) => {
              if (typeof receiveActionCreator === "function") {
                dispatch(receiveActionCreator({ response: {} }));
              }
              resolve({ response: {} });
            });
          }
      );

      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsFilters());
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(RECEIVE_PURCHASE_DETAILS_FILTERS);
      expect(capturedParams.access_token).toBe("TOKEN");
    });
  });

  // ─── getSponsorAssetReport ───────────────────────────────────────────────────

  describe("getSponsorAssetReport", () => {
    it("dispatches REQUEST_SPONSOR_ASSET then RECEIVE_SPONSOR_ASSET", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetReport({ group_by: "sponsor" }));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_SPONSOR_ASSET);
      expect(types).toContain(RECEIVE_SPONSOR_ASSET);
    });

    it("passes access_token and query params", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetReport({ group_by: "sponsor" }));
      await flushPromises();

      expect(capturedParams.access_token).toBe("TOKEN");
      expect(capturedParams.group_by).toBe("sponsor");
    });

    it("uses summit id from state in URL", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetReport());
      await flushPromises();

      expect(capturedUrl).toContain("/summits/42/");
    });

    it("503 export-disabled on read dispatches SPONSOR_ASSET_READ_ERROR (clears loading)", async () => {
      // Simulate getRequest invoking the error handler with a 503 export-disabled response.
      getRequest.mockImplementation(
        (requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          if (requestAC) dispatch(requestAC({}));
          errorHandler(
            {
              status: 503,
              response: {
                body: { message: "CSV export is not enabled for this summit" }
              }
            },
            {}
          )(dispatch);
          return Promise.resolve();
        }
      );

      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetReport({ group_by: "sponsor" }));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_SPONSOR_ASSET);
      // export-disabled must dispatch the loading-clearing READ_ERROR action.
      expect(types).toContain(SPONSOR_ASSET_READ_ERROR);
    });
  });

  // ─── getSponsorAssetFilters ──────────────────────────────────────────────────

  describe("getSponsorAssetFilters", () => {
    it("dispatches RECEIVE_SPONSOR_ASSET_FILTERS with access_token", async () => {
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) =>
          (params = {}) =>
          (dispatch) => {
            capturedParams = params;
            return new Promise((resolve) => {
              if (typeof receiveActionCreator === "function") {
                dispatch(receiveActionCreator({ response: {} }));
              }
              resolve({ response: {} });
            });
          }
      );

      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetFilters());
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(RECEIVE_SPONSOR_ASSET_FILTERS);
      expect(capturedParams.access_token).toBe("TOKEN");
    });
  });

  // ─── getSponsorAssetSponsor ──────────────────────────────────────────────────

  describe("getSponsorAssetSponsor", () => {
    it("dispatches REQUEST_SPONSOR_DRILLDOWN then RECEIVE_SPONSOR_DRILLDOWN", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetSponsor(7));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_SPONSOR_DRILLDOWN);
      expect(types).toContain(RECEIVE_SPONSOR_DRILLDOWN);
    });

    it("uses summit id from state and sponsorId in URL", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetSponsor(7));
      await flushPromises();

      expect(capturedUrl).toContain("/summits/42/");
      expect(capturedUrl).toContain("/sponsors/7");
    });

    it("412 on drilldown read dispatches SPONSOR_DRILLDOWN_READ_ERROR (clears loading)", async () => {
      // Simulate getRequest invoking the error handler with a 412 response.
      getRequest.mockImplementation(
        (requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          if (requestAC) dispatch(requestAC({}));
          errorHandler({ status: 412 }, {})(dispatch);
          return Promise.resolve();
        }
      );

      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetSponsor(17));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_SPONSOR_DRILLDOWN);
      // 412 must dispatch a loading-clearing error action, not silently no-op.
      expect(types).toContain(SPONSOR_DRILLDOWN_READ_ERROR);
    });

    it("503 export-disabled on drilldown read dispatches SPONSOR_DRILLDOWN_READ_ERROR (clears loading)", async () => {
      // Simulate getRequest invoking the error handler with a 503 export-disabled response.
      getRequest.mockImplementation(
        (requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          if (requestAC) dispatch(requestAC({}));
          errorHandler(
            {
              status: 503,
              response: {
                body: { message: "CSV export is not enabled for this summit" }
              }
            },
            {}
          )(dispatch);
          return Promise.resolve();
        }
      );

      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetSponsor(17));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_SPONSOR_DRILLDOWN);
      // export-disabled 503 must also clear loading via an error action.
      expect(types).toContain(SPONSOR_DRILLDOWN_READ_ERROR);
    });
  });

  // ─── makeReadErrorHandler (direct unit tests) ────────────────────────────────

  describe("makeReadErrorHandler", () => {
    let mockDispatch;

    beforeEach(() => {
      mockDispatch = jest.fn();
    });

    it("401 calls doLogin and does not dispatch", () => {
      const onReadError = jest.fn((p) => ({
        type: PURCHASE_DETAILS_READ_ERROR,
        payload: p
      }));
      const handler = makeReadErrorHandler({ onReadError });
      handler({ status: 401 }, {})(mockDispatch);

      expect(doLogin).toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("403 dispatches onReadError", () => {
      const onReadError = jest.fn((p) => ({
        type: PURCHASE_DETAILS_READ_ERROR,
        payload: p
      }));
      const handler = makeReadErrorHandler({ onReadError });
      handler({ status: 403 }, {})(mockDispatch);

      expect(onReadError).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: PURCHASE_DETAILS_READ_ERROR })
      );
    });

    it("412 dispatches onValidationError and leaves body intact", () => {
      const onReadError = jest.fn((p) => ({
        type: PURCHASE_DETAILS_READ_ERROR,
        payload: p
      }));
      const onValidationError = jest.fn((p) => ({
        type: PURCHASE_DETAILS_VALIDATION_ERROR,
        payload: p
      }));
      const handler = makeReadErrorHandler({ onReadError, onValidationError });
      handler({ status: 412 }, {})(mockDispatch);

      expect(onValidationError).toHaveBeenCalled();
      expect(onReadError).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: PURCHASE_DETAILS_VALIDATION_ERROR })
      );
    });

    it("503 with 'CSV export is not enabled' calls onExportDisabled (thunks wire this to READ_ERROR)", () => {
      // makeReadErrorHandler routes export-disabled to onExportDisabled regardless of what
      // the caller wires it to. Thunks now wire onExportDisabled → READ_ERROR; this test
      // verifies the routing layer with a local stub action type.
      const onReadError = jest.fn((p) => ({
        type: PURCHASE_DETAILS_READ_ERROR,
        payload: p
      }));
      const onExportDisabled = jest.fn((p) => ({
        type: PURCHASE_DETAILS_READ_ERROR,
        payload: p
      }));
      const handler = makeReadErrorHandler({ onReadError, onExportDisabled });
      handler(
        {
          status: 503,
          response: {
            body: { message: "CSV export is not enabled for this summit" }
          }
        },
        {}
      )(mockDispatch);

      expect(onExportDisabled).toHaveBeenCalled();
      expect(onReadError).not.toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: PURCHASE_DETAILS_READ_ERROR })
      );
    });
  });
});
