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
  getSponsorAssetFilters,
  getSponsorAssetRows,
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
  RECEIVE_SPONSOR_ASSET_FILTERS,
  REQUEST_SPONSOR_ASSET,
  RECEIVE_SPONSOR_ASSET_ROWS,
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

  // ─── getSponsorAssetRows ─────────────────────────────────────────────────────

  describe("getSponsorAssetRows", () => {
    const rowA = { id: 1, name: "Asset A" };
    const rowB = { id: 2, name: "Asset B" };
    const page1Summary = { total_collected: 5 };

    it("accumulates all pages and dispatches a single atomic RECEIVE_SPONSOR_ASSET_ROWS", async () => {
      // Override the default happy mock with a 2-page sequence distinguished by call order.
      const capturedPages = [];
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => (params) => (dispatch) => {
          capturedPages.push(params.page);
          const response =
            capturedPages.length === 1
              ? { data: [rowA], last_page: 2, summary: page1Summary }
              : { data: [rowB], last_page: 2 };
          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response }));
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);
      await store.dispatch(getSponsorAssetRows({}));
      await flushPromises();

      const actions = store.getActions();

      // 1. getRequest was called for page 1, then page 2 (two total fetches).
      expect(getRequest).toHaveBeenCalledTimes(2);
      expect(capturedPages).toEqual([1, 2]);

      // 2. Exactly one RECEIVE_SPONSOR_ASSET_ROWS was dispatched.
      const rowsActions = actions.filter(
        (a) => a.type === RECEIVE_SPONSOR_ASSET_ROWS
      );
      expect(rowsActions).toHaveLength(1);

      // 3. That action's payload carries the concatenated rows in order.
      expect(rowsActions[0].payload.response.data).toEqual([rowA, rowB]);

      // 4. The carried summary is page 1's summary (embedded in the first response).
      expect(rowsActions[0].payload.response.summary).toEqual(page1Summary);
    });

    it("drops a stale RECEIVE_SPONSOR_ASSET_ROWS when a newer call supersedes it (request token)", async () => {
      // Two back-to-back thunk invocations.  The FIRST call's page-1 fetch is
      // deferred so it resolves AFTER the SECOND call has fully completed.
      // Assert: only one RECEIVE_SPONSOR_ASSET_ROWS is dispatched, carrying the
      // second call's data — the stale first call must not overwrite it.
      let resolveFirstPage;
      let getRequestCallNum = 0;

      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => () => (dispatch) => {
          getRequestCallNum += 1;
          const callNum = getRequestCallNum;
          const data = callNum === 1 ? [{ id: "stale" }] : [{ id: "fresh" }];
          const response = { data, last_page: 1, summary: null };
          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response }));
          }
          if (callNum === 1) {
            // First thunk's page-1 fetch: hold until explicitly released.
            return new Promise((resolve) => {
              resolveFirstPage = () => resolve({ response });
            });
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);

      // Launch stale call — will block at fetchPage(1).
      const stalePromise = store.dispatch(getSponsorAssetRows({}));

      // Launch fresh call — resolves immediately, commits its rows.
      await store.dispatch(getSponsorAssetRows({}));
      await flushPromises();

      // Now unblock the stale call; its RECEIVE_SPONSOR_ASSET_ROWS should be suppressed.
      resolveFirstPage();
      await stalePromise;
      await flushPromises();

      const rowsActions = store
        .getActions()
        .filter((a) => a.type === RECEIVE_SPONSOR_ASSET_ROWS);
      expect(rowsActions).toHaveLength(1);
      expect(rowsActions[0].payload.response.data).toEqual([{ id: "fresh" }]);
    });

    it("suppresses REQUEST_SPONSOR_ASSET from a stale call (prevents stuck-loading after concurrent supersede)", async () => {
      // Hole 1: REQUEST_SPONSOR_ASSET is dispatched after `await getAccessTokenSafely()`.
      // Without the guardedDispatch fix, call A's late REQUEST (after B already committed
      // RECEIVE_SPONSOR_ASSET_ROWS) would flip loading:true with no terminal to clear it.
      //
      // Mechanism: defer call A's token so it resumes AFTER call B has fully committed.
      // mySeq_A is captured synchronously before the await, so sponsorAssetRowsSeq has
      // already been incremented to 2 (by B) before A's token resolves.
      let resolveTokenA;
      jest
        .spyOn(methods, "getAccessTokenSafely")
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveTokenA = () => resolve("TOKEN");
            })
        )
        .mockResolvedValue("TOKEN"); // B and any subsequent calls resolve immediately

      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => () => (guardedOrDispatch) => {
          const response = {
            data: [{ id: "fresh" }],
            last_page: 1,
            summary: null
          };
          if (typeof receiveActionCreator === "function") {
            guardedOrDispatch(receiveActionCreator({ response }));
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);

      // Start stale call A — blocks waiting for its token (mySeq_A=1, seq=1).
      const stalePromise = store.dispatch(getSponsorAssetRows({}));
      // Start fresh call B — token resolves immediately; bumps seq to 2 before A resumes.
      await store.dispatch(getSponsorAssetRows({}));
      await flushPromises();

      // Unblock A: A's token resolves. At this point mySeq_A=1 but sponsorAssetRowsSeq=2.
      // guardedDispatch suppresses A's REQUEST_SPONSOR_ASSET (and every subsequent dispatch).
      resolveTokenA();
      await stalePromise;
      await flushPromises();

      const actions = store.getActions();
      // Only B's REQUEST dispatched — A's was suppressed (would have flipped loading:true).
      const requestActions = actions.filter(
        (a) => a.type === REQUEST_SPONSOR_ASSET
      );
      expect(requestActions).toHaveLength(1);
      // Only B's RECEIVE dispatched — A's is also suppressed.
      const receiveActions = actions.filter(
        (a) => a.type === RECEIVE_SPONSOR_ASSET_ROWS
      );
      expect(receiveActions).toHaveLength(1);
      // The last loading-relevant action is B's RECEIVE → loading ends false (not stuck true).
      const loadingRelevant = actions.filter(
        (a) =>
          a.type === REQUEST_SPONSOR_ASSET ||
          a.type === RECEIVE_SPONSOR_ASSET_ROWS ||
          a.type === SPONSOR_ASSET_READ_ERROR
      );
      expect(loadingRelevant[loadingRelevant.length - 1].type).toBe(
        RECEIVE_SPONSOR_ASSET_ROWS
      );
    });

    it("suppresses SPONSOR_ASSET_READ_ERROR from a stale call's error handler (stale HTTP error cannot clobber fresh success)", async () => {
      // Hole 2: fetchPage passed raw dispatch to getRequest, so a stale request's HTTP error
      // fired SPONSOR_ASSET_READ_ERROR unguarded — persisting readError over fresh success.
      //
      // Mechanism: defer A's token so B commits success first. Then switch the getRequest mock
      // to invoke the error handler (simulating HTTP 403) before resolving A's token so that
      // when A calls fetchPage it triggers the error path through its own guardedDispatch.
      // Note: makeReadErrorHandler for the default/403 branch calls onReadError which dispatches
      // SPONSOR_ASSET_READ_ERROR. With the fix, this dispatch goes through guardedDispatch
      // (mySeq_A=1 ≠ seq=2) and is suppressed.
      // Fidelity caveat: this test simulates the error handler being invoked by the getRequest
      // mock directly rather than by the real uicore HTTP layer. It honestly exercises that
      // guardedDispatch (passed as the dispatch arg) blocks the handler's dispatch when stale.
      let resolveTokenA;
      jest
        .spyOn(methods, "getAccessTokenSafely")
        .mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveTokenA = () => resolve("TOKEN");
            })
        )
        .mockResolvedValue("TOKEN");

      // Initial mock: B calls this and succeeds.
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => () => (guardedOrDispatch) => {
          const response = {
            data: [{ id: "fresh" }],
            last_page: 1,
            summary: null
          };
          if (typeof receiveActionCreator === "function") {
            guardedOrDispatch(receiveActionCreator({ response }));
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);

      // Start stale call A — deferred token; start fresh call B — resolves and commits.
      const stalePromise = store.dispatch(getSponsorAssetRows({}));
      await store.dispatch(getSponsorAssetRows({}));
      await flushPromises();

      // Switch mock to error path BEFORE unblocking A. When A's fetchPage runs it will
      // invoke the errorHandler through A's guardedDispatch (mySeq_A=1 ≠ seq=2 → suppressed).
      // The mock returns Promise.resolve() (no {response}) which causes a TypeError in the
      // thunk's try block; the catch also dispatches via guardedDispatch — also suppressed.
      getRequest.mockImplementation(
        (_requestAC, _receiveAC, _url, errorHandler) =>
          () =>
          (guardedOrDispatch) => {
            // Simulate getRequest invoking the error handler for a 403 (dispatches onReadError).
            errorHandler({ status: 403 }, {})(guardedOrDispatch);
            return Promise.resolve(); // no {response} → TypeError in thunk → catch also guarded
          }
      );

      resolveTokenA();
      await stalePromise;
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      // B's success committed and must stand.
      expect(types).toContain(RECEIVE_SPONSOR_ASSET_ROWS);
      // A's stale error must NOT appear — guardedDispatch swallows both the error handler's
      // dispatch and the catch's dispatch.
      expect(types).not.toContain(SPONSOR_ASSET_READ_ERROR);
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

    it("exportSponsorAssetCsv → assets URL, keeps filters, strips order/pagination", async () => {
      // Pass an input that buildReportQuery WOULD emit pagination/order for,
      // to actually exercise the strip (the page only ever passes flat filters, but the
      // thunk's contract is a flat export regardless).
      await exportSponsorAssetCsv({
        sponsorIds: [17],
        page: 2,
        perPage: 25,
        order: "status"
      })(dispatch, getState);
      const [url, params, filename] = getCSV.mock.calls[0];
      expect(url).toBe(
        "http://test-api/api/v1/summits/42/reports/sponsor-assets/csv"
      );
      expect(params["filter[]"]).toEqual(["sponsor_id==17"]); // filter survives
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

    it("exportSponsorAssetSectionCsv → bails (no CSV) on a non-positive-int id rather than broadening the export", async () => {
      // A missing/invalid page_id must NOT widen the CSV to the whole sponsor.
      await exportSponsorAssetSectionCsv("17", "0")(dispatch, getState);
      await exportSponsorAssetSectionCsv("abc", "3")(dispatch, getState);
      expect(getCSV).not.toHaveBeenCalled();
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
