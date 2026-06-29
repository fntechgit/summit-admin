import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  getCSV
} from "openstack-uicore-foundation/lib/utils/actions";
import { doLogin } from "openstack-uicore-foundation/lib/security/methods";
import * as methods from "../../utils/methods";
import { makeReadErrorHandler } from "../sponsor-reports-errors";

import {
  getPurchaseDetailsReport,
  getPurchaseDetailsFilters,
  getSponsorAssetReport,
  getSponsorAssetFilters,
  getSponsorAssetSponsor,
  exportPurchaseDetailsCsv,
  exportPurchaseDetailsLinesCsv,
  exportSponsorAssetCsv,
  exportSponsorAssetSectionCsv,
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
  getRequest: jest.fn(),
  getCSV: jest.fn(() => ({ type: "GET_CSV_MOCK" }))
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
    getCSV.mockClear();
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
      store.dispatch(getPurchaseDetailsReport({}, { page: 1 }));
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

    it("passes access_token and built query params (page, per_page) in outgoing request", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport({}, { page: 2, perPage: 25 }));
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
      store.dispatch(getPurchaseDetailsReport({}, { page: 1 }));
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
      store.dispatch(getSponsorAssetReport({}, { groupBy: "sponsor" }));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(REQUEST_SPONSOR_ASSET);
      expect(types).toContain(RECEIVE_SPONSOR_ASSET);
    });

    it("passes access_token and built group_by param in outgoing request", async () => {
      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetReport({}, { groupBy: "sponsor" }));
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
      store.dispatch(getSponsorAssetReport({}, { groupBy: "sponsor" }));
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

  // ─── getPurchaseDetailsLinesReport ──────────────────────────────────────────

  describe("getPurchaseDetailsLinesReport", () => {
    beforeEach(() => {
      jest
        .spyOn(methods, "getAccessTokenSafely")
        .mockResolvedValue("test-token");
    });

    it("GETs the /purchase-details/lines endpoint with built query + access_token and NO order", async () => {
      makeHappyGetRequest();
      const store = mockStore(MOCK_STATE);
      const {
        getPurchaseDetailsLinesReport
      } = require("../sponsor-reports-actions");
      // Pass primitives (filters + pagination); thunk calls buildPurchaseLinesQuery internally.
      await store.dispatch(
        getPurchaseDetailsLinesReport(
          { sponsorIds: [17] },
          { page: 1, perPage: 50 }
        )
      );
      await flushPromises();

      expect(capturedUrl).toMatch(
        /\/api\/v1\/summits\/42\/reports\/purchase-details\/lines$/
      );
      // buildPurchaseLinesQuery({ sponsorIds: [17] }, { page: 1, perPage: 50 }) →
      // { "filter[]": ["sponsor_id==17"], page: 1, per_page: 50 } — no order emitted.
      expect(capturedParams).toMatchObject({
        access_token: "test-token",
        page: 1,
        per_page: 50,
        "filter[]": ["sponsor_id==17"]
      });
      expect(capturedParams).not.toHaveProperty("order");

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain("REQUEST_PURCHASE_DETAILS_LINES");
      expect(types).toContain("RECEIVE_PURCHASE_DETAILS_LINES");
    });
  });

  // ─── exportPurchaseDetailsCsv / exportPurchaseDetailsLinesCsv ───────────────

  describe("exportPurchaseDetailsCsv / exportPurchaseDetailsLinesCsv", () => {
    let dispatch;
    let getState;

    beforeEach(() => {
      jest
        .spyOn(methods, "getAccessTokenSafely")
        .mockResolvedValue("test-token");
      getCSV.mockClear();
      dispatch = jest.fn();
      getState = () => ({ currentSummitState: { currentSummit: { id: 42 } } });
      window.SPONSOR_REPORTS_API_URL = "http://test-api";
    });

    it("exportPurchaseDetailsCsv → getCSV with orders URL, sort, expanded dates, no pagination", async () => {
      await exportPurchaseDetailsCsv(
        { dateFrom: "2026-01-01", dateTo: "2026-01-31" },
        "order_date",
        -1
      )(dispatch, getState);
      const [url, params, filename] = getCSV.mock.calls[0];
      expect(url).toBe(
        "http://test-api/api/v1/summits/42/reports/purchase-details/csv"
      );
      expect(params).toMatchObject({
        access_token: "test-token",
        order: "-order_date"
      });
      expect(params["filter[]"]).toEqual(
        expect.arrayContaining([
          "order_date>=2026-01-01T00:00:00Z",
          "order_date<2026-02-01T00:00:00Z"
        ])
      );
      expect(params).not.toHaveProperty("page");
      expect(params).not.toHaveProperty("per_page");
      expect(filename).toBe("purchase-details-summit-42.csv");
    });

    it("exportPurchaseDetailsCsv encodes ascending sort too", async () => {
      await exportPurchaseDetailsCsv({}, "number", 1)(dispatch, getState);
      expect(getCSV.mock.calls[0][1].order).toBe("number");
    });

    it("exportPurchaseDetailsLinesCsv → lines URL, no order, lines filename", async () => {
      await exportPurchaseDetailsLinesCsv({ status: "Paid" })(
        dispatch,
        getState
      );
      const [url, params, filename] = getCSV.mock.calls[0];
      expect(url).toBe(
        "http://test-api/api/v1/summits/42/reports/purchase-details/lines/csv"
      );
      expect(params).not.toHaveProperty("order");
      expect(filename).toBe("purchase-details-lines-summit-42.csv");
    });
  });

  // ─── exportSponsorAssetCsv / exportSponsorAssetSectionCsv ───────────────────

  describe("exportSponsorAssetCsv / exportSponsorAssetSectionCsv", () => {
    let dispatch;
    let getState;

    beforeEach(() => {
      jest
        .spyOn(methods, "getAccessTokenSafely")
        .mockResolvedValue("test-token");
      getCSV.mockClear();
      dispatch = jest.fn();
      getState = () => ({
        currentSummitState: { currentSummit: { id: 42 } }
      });
      window.SPONSOR_REPORTS_API_URL = "http://test-api";
    });

    it("exportSponsorAssetCsv → assets URL, keeps filters, strips group_by/order/pagination", async () => {
      // Pass an input that buildReportQuery WOULD emit grouping/pagination/order for,
      // to actually exercise the strip (the page only ever passes flat filters, but the
      // thunk's contract is a flat export regardless).
      await exportSponsorAssetCsv({
        sponsorIds: [17],
        groupBy: "component",
        page: 2,
        perPage: 25,
        order: "status"
      })(dispatch, getState);
      const [url, params, filename] = getCSV.mock.calls[0];
      expect(url).toBe(
        "http://test-api/api/v1/summits/42/reports/sponsor-assets/csv"
      );
      expect(params["filter[]"]).toEqual(["sponsor_id==17"]); // filter survives
      expect(params).not.toHaveProperty("group_by");
      expect(params).not.toHaveProperty("order");
      expect(params).not.toHaveProperty("page");
      expect(params).not.toHaveProperty("per_page");
      expect(filename).toBe("sponsor-assets-summit-42.csv");
    });

    it("exportSponsorAssetSectionCsv → sponsor_id/page_id + collected (Media) filter + filename", async () => {
      await exportSponsorAssetSectionCsv("17", "3")(dispatch, getState);
      const [url, params, filename] = getCSV.mock.calls[0];
      expect(url).toBe(
        "http://test-api/api/v1/summits/42/reports/sponsor-assets/csv"
      );
      // Collected-only: the per-page CSV is scoped to Media, matching the view.
      expect(params["filter[]"]).toEqual([
        "sponsor_id==17",
        "page_id==3",
        "module_type==Media"
      ]);
      expect(filename).toBe("sponsor-17-page-3.csv");
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
