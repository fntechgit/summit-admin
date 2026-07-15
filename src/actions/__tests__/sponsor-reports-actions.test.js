import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  getCSV,
  authErrorHandler,
  START_LOADING,
  STOP_LOADING
} from "openstack-uicore-foundation/lib/utils/actions";
import * as methods from "../../utils/methods";

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
  SPONSOR_DRILLDOWN_READ_ERROR,
  getPurchaseDetailsByItemRows,
  REQUEST_PURCHASE_DETAILS_BY_ITEM,
  RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS,
  PURCHASE_DETAILS_BY_ITEM_READ_ERROR
} from "../sponsor-reports-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  getCSV: jest.fn(() => ({ type: "GET_CSV_MOCK" })),
  // 401s delegate here for the guarded (session-clearing) re-login. Stub it to a
  // no-op thunk so we can assert delegation without triggering a real redirect.
  authErrorHandler: jest.fn(() => () => {})
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
    authErrorHandler.mockClear();
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

    it("records pagination/sort/filter via the getRequest REQUEST payload (5th arg)", async () => {
      const store = mockStore(MOCK_STATE);
      const filters = { status: "Paid" };
      store.dispatch(
        getPurchaseDetailsReport(filters, {
          page: 2,
          perPage: 25,
          order: "number",
          orderDir: -1
        })
      );
      await flushPromises();

      // The reducer records these off the REQUEST action so pagination/sort/filter
      // persist across SPA navigation. uicore getRequest forwards its 5th argument
      // as the REQUEST action payload.
      const stateArg = getRequest.mock.calls[0][4];
      expect(stateArg).toStrictEqual({
        currentPage: 2,
        perPage: 25,
        order: "number",
        orderDir: -1,
        filters
      });
    });

    it("503 on read dispatches PURCHASE_DETAILS_READ_ERROR (clears loading, inline body)", async () => {
      // Simulate getRequest invoking the error handler with a 503 (feature-off /
      // export-disabled) response — a generic read error replaces the body.
      getRequest.mockImplementation(
        (requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          if (requestAC) dispatch(requestAC({}));
          errorHandler(
            {
              status: 503,
              response: {
                body: { message: "Reports are not enabled for this summit" }
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
      // A 503 must dispatch the loading-clearing READ_ERROR action.
      expect(types).toContain(PURCHASE_DETAILS_READ_ERROR);
      // Payload carries the status + server message for the inline body (no
      // synthetic "kind" — only 404 is tagged, for the drilldown not-found panel).
      const readErr = actions.find(
        (a) => a.type === PURCHASE_DETAILS_READ_ERROR
      );
      expect(readErr.payload).toMatchObject({
        status: 503,
        message: "Reports are not enabled for this summit"
      });
      expect(readErr.payload.kind).toBeUndefined();
    });

    it("drops a stale RECEIVE_PURCHASE_DETAILS when a newer call supersedes it (sequence token)", async () => {
      // Call A's response is held so it lands AFTER call B completes. Different
      // filters → different getRequest abort keys, so A is never cancelled; only
      // the sequence guard keeps its late RECEIVE from overwriting B's data.
      let releaseStale;
      let callNum = 0;
      getRequest.mockImplementation(
        (requestAC, receiveActionCreator) => () => (dispatch) => {
          callNum += 1;
          if (typeof requestAC === "function") dispatch(requestAC({}));
          if (callNum === 1) {
            return new Promise((resolve) => {
              releaseStale = () => {
                // Real getRequest dispatches RECEIVE when the response arrives.
                dispatch(
                  receiveActionCreator({
                    response: { data: [{ id: "stale" }] }
                  })
                );
                resolve();
              };
            });
          }
          dispatch(
            receiveActionCreator({ response: { data: [{ id: "fresh" }] } })
          );
          return Promise.resolve();
        }
      );

      const store = mockStore(MOCK_STATE);
      // A: fires its request while still current, parks at the held response.
      const stalePromise = store.dispatch(
        getPurchaseDetailsReport({ status: "Paid" }, { page: 1 })
      );
      await flushPromises();
      // B supersedes A and completes.
      await store.dispatch(
        getPurchaseDetailsReport({ status: "Pending" }, { page: 1 })
      );
      await flushPromises();
      // A's response finally lands — its RECEIVE must be suppressed.
      releaseStale();
      await stalePromise;
      await flushPromises();

      const receives = store
        .getActions()
        .filter((a) => a.type === RECEIVE_PURCHASE_DETAILS);
      expect(receives).toHaveLength(1);
      expect(receives[0].payload.response.data).toEqual([{ id: "fresh" }]);
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

    it("drops the old summit's stale RECEIVE_PURCHASE_DETAILS_FILTERS after a summit switch (sequence token)", async () => {
      // Summit switch: the URL changes with the summit id, so the old summit's
      // in-flight filters request is never cancelled (different abort key). If
      // its response lands after the new summit's, the sequence guard must drop
      // it — otherwise filterOptions repopulate with the OLD summit's options.
      let releaseStale;
      let callNum = 0;
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => () => (dispatch) => {
          callNum += 1;
          if (callNum === 1) {
            return new Promise((resolve) => {
              releaseStale = () => {
                dispatch(
                  receiveActionCreator({
                    response: { sponsors: [{ id: 1, name: "old-summit" }] }
                  })
                );
                resolve();
              };
            });
          }
          dispatch(
            receiveActionCreator({
              response: { sponsors: [{ id: 2, name: "new-summit" }] }
            })
          );
          return Promise.resolve();
        }
      );

      // Old summit (42) fetch parks at its held response; the summit switch
      // remounts the page, which fetches the new summit (43).
      const oldStore = mockStore(MOCK_STATE);
      const stalePromise = oldStore.dispatch(getPurchaseDetailsFilters());
      await flushPromises();
      const newStore = mockStore({
        currentSummitState: { currentSummit: { id: 43 } }
      });
      await newStore.dispatch(getPurchaseDetailsFilters());
      await flushPromises();
      releaseStale();
      await stalePromise;
      await flushPromises();

      // The stale receive must be suppressed entirely; only the new summit's commits.
      const staleReceives = oldStore
        .getActions()
        .filter((a) => a.type === RECEIVE_PURCHASE_DETAILS_FILTERS);
      expect(staleReceives).toHaveLength(0);
      const freshReceives = newStore
        .getActions()
        .filter((a) => a.type === RECEIVE_PURCHASE_DETAILS_FILTERS);
      expect(freshReceives).toHaveLength(1);
      expect(freshReceives[0].payload.response.sponsors[0].name).toBe(
        "new-summit"
      );
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

    it("records the active filters on the REQUEST_SPONSOR_ASSET action", async () => {
      const store = mockStore(MOCK_STATE);
      const filters = { sponsorIds: [17] };
      await store.dispatch(getSponsorAssetRows(filters));
      await flushPromises();

      // The thunk dispatches REQUEST directly (not via getRequest's 5th arg) so the
      // reducer records the active filters for SPA-navigation persistence.
      const req = store
        .getActions()
        .find((a) => a.type === REQUEST_SPONSOR_ASSET);
      expect(req).toBeDefined();
      expect(req.payload).toStrictEqual({ filters });
    });

    it("bulk-loads all pages (page 1, then the rest in parallel) into one atomic RECEIVE_SPONSOR_ASSET_ROWS", async () => {
      // Three pages keyed by page number so the parallel rest-page fetch (2+3) is
      // exercised, not just a single trailing page.
      const rowC = { id: 3, name: "Asset C" };
      const capturedPages = [];
      const capturedPerPage = [];
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => (params) => (dispatch) => {
          capturedPages.push(params.page);
          capturedPerPage.push(params.per_page);
          const byPage = {
            1: { data: [rowA], last_page: 3, summary: page1Summary },
            2: { data: [rowB], last_page: 3 },
            3: { data: [rowC], last_page: 3 }
          };
          const response = byPage[params.page];
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

      // 1. All three pages fetched (page 1 first, 2+3 bulk-loaded); order-independent.
      expect(getRequest).toHaveBeenCalledTimes(3);
      expect([...capturedPages].sort((a, b) => a - b)).toEqual([1, 2, 3]);

      // 2. A reasonable page size is requested — not one oversized page.
      expect(capturedPerPage).toEqual([100, 100, 100]);

      // 3. Exactly one atomic RECEIVE_SPONSOR_ASSET_ROWS was dispatched.
      const rowsActions = actions.filter(
        (a) => a.type === RECEIVE_SPONSOR_ASSET_ROWS
      );
      expect(rowsActions).toHaveLength(1);

      // 4. Its payload carries the rows concatenated in page order (Promise.all
      //    preserves array order regardless of completion order).
      expect(rowsActions[0].payload.response.data).toEqual([rowA, rowB, rowC]);

      // 5. The carried summary is page 1's summary (embedded in the first response).
      expect(rowsActions[0].payload.response.summary).toEqual(page1Summary);
    });

    it("a superseded invocation does not fire its queued rest-page requests", async () => {
      // Call A's page-1 fetch is deferred and reports last_page: 2, so A has a
      // queued rest page. Call B runs fully first (bumping the seq). When A's page 1
      // finally resolves, A is stale — its queued page-2 request must NOT hit the
      // network (a stale identical-page request could abort the fresh call's).
      let resolveAPage1;
      let callNum = 0;
      const capturedPages = [];
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => (params) => (dispatch) => {
          callNum += 1;
          const isAPage1 = callNum === 1;
          capturedPages.push(params.page);
          if (isAPage1) {
            // A's page 1: deferred, and advertises a second page.
            const response = {
              data: [{ id: "A1" }],
              last_page: 2,
              summary: null
            };
            return new Promise((resolve) => {
              resolveAPage1 = () => resolve({ response });
            });
          }
          const response = {
            data: [{ id: `p${params.page}` }],
            last_page: 1,
            summary: null
          };
          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response }));
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);
      // Let A advance — while still current (seq=1) — to its held page-1 fetch, so
      // it is superseded DURING the load (not at the token-stage bail).
      const stalePromise = store.dispatch(getSponsorAssetRows({})); // A
      await flushPromises();
      await store.dispatch(getSponsorAssetRows({})); // B runs fully, supersedes A
      resolveAPage1(); // A resumes — now stale
      await stalePromise;
      await flushPromises();

      // A must never have issued its page-2 request; only page-1 calls happened
      // (A's deferred page 1 + B's page 1). No captured page is 2.
      expect(capturedPages).not.toContain(2);
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

      // Launch stale call A and let it advance — while still the current call
      // (seq=1) — to its held page-1 fetch. It takes getRequest call #1 (deferred)
      // and parks there. This way A is superseded DURING its fetch, exercising the
      // guardedDispatch RECEIVE-drop rather than the earlier token-stage staleness
      // bail (which the sibling test covers).
      const stalePromise = store.dispatch(getSponsorAssetRows({}));
      await flushPromises();

      // Launch fresh call B — bumps seq to 2, resolves immediately, commits its rows.
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
      // Note: reportReadErrorHandler for the default/403 branch calls onReadError which dispatches
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

    it("live 401 delegates to authErrorHandler and dispatches no inline read error", async () => {
      // uicore invokes the error handler, then REJECTS with a plain {err,res} object.
      getRequest.mockImplementation(
        (_requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          errorHandler({ status: 401 }, {})(dispatch);
          // Non-Error reject models uicore's HTTP-failure shape (the case under test).
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject({ err: { status: 401 }, res: {} });
        }
      );

      const store = mockStore(MOCK_STATE);
      await store.dispatch(getSponsorAssetRows({}));
      await flushPromises();

      // 401 delegates to guarded reauth; the catch must NOT flash a read error over it.
      expect(authErrorHandler).toHaveBeenCalledWith({ status: 401 }, {});
      const types = store.getActions().map((a) => a.type);
      expect(types).not.toContain(SPONSOR_ASSET_READ_ERROR);
    });

    it("live 403 surfaces the server message once (catch does not clobber it)", async () => {
      getRequest.mockImplementation(
        (_requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          errorHandler(
            { status: 403, response: { body: { message: "Forbidden here" } } },
            {}
          )(dispatch);
          // Non-Error reject models uicore's HTTP-failure shape (the case under test).
          // eslint-disable-next-line prefer-promise-reject-errors
          return Promise.reject({ err: { status: 403 }, res: {} });
        }
      );

      const store = mockStore(MOCK_STATE);
      await store.dispatch(getSponsorAssetRows({}));
      await flushPromises();

      // Exactly one READ_ERROR (from the handler) with the server message intact —
      // the catch's non-HTTP net must not fire a second, message-less dispatch.
      const readErrs = store
        .getActions()
        .filter((a) => a.type === SPONSOR_ASSET_READ_ERROR);
      expect(readErrs).toHaveLength(1);
      expect(readErrs[0].payload).toMatchObject({
        status: 403,
        message: "Forbidden here"
      });
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

    it("503 on drilldown read dispatches SPONSOR_DRILLDOWN_READ_ERROR (clears loading)", async () => {
      // Simulate getRequest invoking the error handler with a 503 response.
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
      // a 503 must also clear loading via an error action.
      expect(types).toContain(SPONSOR_DRILLDOWN_READ_ERROR);
    });

    it("drops sponsor A's stale RECEIVE_SPONSOR_DRILLDOWN after navigating to sponsor B (sequence token)", async () => {
      // A → B navigation: different sponsorId = different abort key, so A's
      // in-flight request is never cancelled. If A's response lands after B's,
      // the sequence guard must drop it — otherwise the drill-down shows
      // sponsor A's data under sponsor B's URL.
      let releaseStale;
      let callNum = 0;
      getRequest.mockImplementation(
        (requestAC, receiveActionCreator) => () => (dispatch) => {
          callNum += 1;
          if (typeof requestAC === "function") dispatch(requestAC({}));
          if (callNum === 1) {
            return new Promise((resolve) => {
              releaseStale = () => {
                dispatch(
                  receiveActionCreator({ response: { sponsor: { id: 683 } } })
                );
                resolve();
              };
            });
          }
          dispatch(receiveActionCreator({ response: { sponsor: { id: 17 } } }));
          return Promise.resolve();
        }
      );

      const store = mockStore(MOCK_STATE);
      const stalePromise = store.dispatch(getSponsorAssetSponsor(683));
      await flushPromises();
      await store.dispatch(getSponsorAssetSponsor(17));
      await flushPromises();
      releaseStale();
      await stalePromise;
      await flushPromises();

      const receives = store
        .getActions()
        .filter((a) => a.type === RECEIVE_SPONSOR_DRILLDOWN);
      expect(receives).toHaveLength(1);
      expect(receives[0].payload.response.sponsor.id).toBe(17);
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

      // 5th arg → REQUEST_PURCHASE_DETAILS_LINES payload the reducer records.
      const stateArg = getRequest.mock.calls[0][4];
      expect(stateArg).toStrictEqual({
        currentPage: 1,
        perPage: 50,
        filters: { sponsorIds: [17] }
      });
    });

    it("drops a stale RECEIVE_PURCHASE_DETAILS_LINES when a newer call supersedes it (sequence token)", async () => {
      const {
        getPurchaseDetailsLinesReport
      } = require("../sponsor-reports-actions");
      // Call A (page 1) is held so its response lands AFTER call B (page 2)
      // completes; the abort key includes `page`, so A is never cancelled and
      // only the sequence guard keeps its stale RECEIVE out of the store.
      let releaseStale;
      let callNum = 0;
      getRequest.mockImplementation(
        (requestAC, receiveActionCreator) => () => (dispatch) => {
          callNum += 1;
          if (typeof requestAC === "function") dispatch(requestAC({}));
          if (callNum === 1) {
            return new Promise((resolve) => {
              releaseStale = () => {
                dispatch(
                  receiveActionCreator({
                    response: { data: [{ id: "stale" }] }
                  })
                );
                resolve();
              };
            });
          }
          dispatch(
            receiveActionCreator({ response: { data: [{ id: "fresh" }] } })
          );
          return Promise.resolve();
        }
      );

      const store = mockStore(MOCK_STATE);
      const stalePromise = store.dispatch(
        getPurchaseDetailsLinesReport({}, { page: 1, perPage: 50 })
      );
      await flushPromises();
      await store.dispatch(
        getPurchaseDetailsLinesReport({}, { page: 2, perPage: 50 })
      );
      await flushPromises();
      releaseStale();
      await stalePromise;
      await flushPromises();

      const receives = store
        .getActions()
        .filter((a) => a.type === "RECEIVE_PURCHASE_DETAILS_LINES");
      expect(receives).toHaveLength(1);
      expect(receives[0].payload.response.data).toEqual([{ id: "fresh" }]);
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

  // ─── reportReadErrorHandler (exercised through the thunks) ────────────────────
  // The handler is module-private (folded into the actions file, matching the
  // rest of src/actions), so it is covered via the thunks that wire it — the
  // same integration style as every other error assertion above.

  describe("reportReadErrorHandler", () => {
    // Drive a chosen status through a thunk's error handler.
    const mockErrorStatus = (err) =>
      getRequest.mockImplementation(
        (requestAC, _receiveAC, _url, errorHandler) => () => (dispatch) => {
          if (requestAC) dispatch(requestAC({}));
          errorHandler(err, {})(dispatch);
          return Promise.resolve();
        }
      );

    it("401 delegates to uicore authErrorHandler and dispatches no read error", async () => {
      mockErrorStatus({ status: 401 });

      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport({}, { page: 1 }));
      await flushPromises();

      // Guarded re-login is the platform handler's job (dedupes concurrent 401s).
      expect(authErrorHandler).toHaveBeenCalledWith({ status: 401 }, {});
      const types = store.getActions().map((a) => a.type);
      expect(types).not.toContain(PURCHASE_DETAILS_READ_ERROR);
      expect(types).not.toContain(PURCHASE_DETAILS_VALIDATION_ERROR);
    });

    it("403 replaces the body via READ_ERROR (no synthetic kind)", async () => {
      mockErrorStatus({ status: 403 });

      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport({}, { page: 1 }));
      await flushPromises();

      const readErr = store
        .getActions()
        .find((a) => a.type === PURCHASE_DETAILS_READ_ERROR);
      expect(readErr).toBeDefined();
      expect(readErr.payload).toMatchObject({ status: 403 });
      expect(readErr.payload.kind).toBeUndefined();
      expect(authErrorHandler).not.toHaveBeenCalled();
    });

    it("412 routes to VALIDATION_ERROR and leaves the body intact", async () => {
      mockErrorStatus({
        status: 412,
        response: { body: { message: "Bad date range" } }
      });

      const store = mockStore(MOCK_STATE);
      store.dispatch(getPurchaseDetailsReport({}, { page: 1 }));
      await flushPromises();

      const types = store.getActions().map((a) => a.type);
      expect(types).toContain(PURCHASE_DETAILS_VALIDATION_ERROR);
      expect(types).not.toContain(PURCHASE_DETAILS_READ_ERROR);
      const vErr = store
        .getActions()
        .find((a) => a.type === PURCHASE_DETAILS_VALIDATION_ERROR);
      expect(vErr.payload).toMatchObject({
        status: 412,
        message: "Bad date range"
      });
    });

    it("404 on the drilldown tags the body kind:'not-found'", async () => {
      mockErrorStatus({ status: 404 });

      const store = mockStore(MOCK_STATE);
      store.dispatch(getSponsorAssetSponsor(17));
      await flushPromises();

      const readErr = store
        .getActions()
        .find((a) => a.type === SPONSOR_DRILLDOWN_READ_ERROR);
      expect(readErr).toBeDefined();
      expect(readErr.payload).toMatchObject({ status: 404, kind: "not-found" });
    });
  });

  // ─── No current summit: mount-fetch guard ────────────────────────────────────
  // Refutes the "stale-summit / stuck-empty" review concern at the thunk layer: a
  // mount fetch that fires without a summit in context is a safe no-op — it returns
  // a resolved promise, dispatches nothing, and never issues a request. Paired with
  // SummitIdLayout (summit-id-layout.test.js), which gates these pages so they only
  // mount with a loaded, URL-matching summit and remounts on a summit switch, there
  // is no reachable stuck-empty state.
  describe("no current summit → mount fetches no-op", () => {
    // null, {} and { id: 0 } must ALL be treated as "no summit". Testing only null
    // would let a weaker guard survive: `if (!currentSummit) return` passes for null
    // but wrongly proceeds for {} / { id: 0 } — the real guard is `!currentSummit?.id`.
    const NO_SUMMIT_VALUES = [
      ["null", null],
      ["an empty object", {}],
      ["id 0", { id: 0 }]
    ];
    const FETCHES = [
      ["getSponsorAssetFilters", getSponsorAssetFilters],
      ["getSponsorAssetRows", getSponsorAssetRows],
      ["getPurchaseDetailsFilters", getPurchaseDetailsFilters]
    ];

    describe.each(NO_SUMMIT_VALUES)(
      "currentSummit = %s",
      (_label, currentSummit) => {
        it.each(FETCHES)(
          "%s dispatches nothing and issues no request",
          async (_name, fetchThunk) => {
            const store = mockStore({ currentSummitState: { currentSummit } });
            await store.dispatch(fetchThunk());
            await flushPromises();
            expect(store.getActions()).toEqual([]);
            expect(getRequest).not.toHaveBeenCalled();
          }
        );
      }
    );
  });

  // ─── getPurchaseDetailsByItemRows ────────────────────────────────────────────

  describe("getPurchaseDetailsByItemRows", () => {
    const rowA = { item_code: "A1", quantity: 1 };
    const rowB = { item_code: "B1", quantity: 2 };
    const rowC = { item_code: "C1", quantity: 3 };
    const page1Summary = { total_orders: 11 };

    it("records the active filters on REQUEST and hits the lines endpoint without paymentMethod", async () => {
      const store = mockStore(MOCK_STATE);
      const filters = { sponsorIds: [17], paymentMethod: "Card" };
      await store.dispatch(getPurchaseDetailsByItemRows(filters));
      await flushPromises();

      const req = store
        .getActions()
        .find((a) => a.type === REQUEST_PURCHASE_DETAILS_BY_ITEM);
      expect(req).toBeDefined();
      expect(req.payload).toStrictEqual({ filters });
      // toContain, NOT toBe with a hardcoded base: the export describes in this
      // file set window.SPONSOR_REPORTS_API_URL in their beforeEach and never
      // clear it, so the resolved base depends on declaration order.
      expect(capturedUrl).toContain(
        "/summits/42/reports/purchase-details/lines"
      );
      // buildPurchaseLinesQuery drops paymentMethod (order-level attribute).
      const filterClauses = capturedParams["filter[]"] || [];
      expect(
        filterClauses.some((c) => String(c).includes("payment_method"))
      ).toBe(false);
    });

    it("bulk-loads all pages (page 1, then the rest in parallel) into one atomic RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS", async () => {
      const capturedPages = [];
      const capturedPerPage = [];
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => (params) => (dispatch) => {
          capturedPages.push(params.page);
          capturedPerPage.push(params.per_page);
          const byPage = {
            1: { data: [rowA], last_page: 3, summary: page1Summary },
            2: { data: [rowB], last_page: 3 },
            3: { data: [rowC], last_page: 3 }
          };
          const response = byPage[params.page];
          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response }));
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);
      await store.dispatch(getPurchaseDetailsByItemRows({}));
      await flushPromises();

      expect(getRequest).toHaveBeenCalledTimes(3);
      expect([...capturedPages].sort((a, b) => a - b)).toEqual([1, 2, 3]);
      expect(capturedPerPage).toEqual([100, 100, 100]);

      const rowsActions = store
        .getActions()
        .filter((a) => a.type === RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS);
      expect(rowsActions).toHaveLength(1);
      expect(rowsActions[0].payload.response.data).toEqual([rowA, rowB, rowC]);
      // Summary rides page 1 (backend computes it over the whole filtered set).
      expect(rowsActions[0].payload.response.summary).toEqual(page1Summary);
    });

    it("a superseded invocation does not fire its queued rest-page requests", async () => {
      let resolveAPage1;
      let callNum = 0;
      const capturedPages = [];
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator) => (params) => (dispatch) => {
          callNum += 1;
          const isAPage1 = callNum === 1;
          capturedPages.push(params.page);
          if (isAPage1) {
            const response = {
              data: [{ id: "A1" }],
              last_page: 2,
              summary: null
            };
            return new Promise((resolve) => {
              resolveAPage1 = () => resolve({ response });
            });
          }
          const response = {
            data: [{ id: `p${params.page}` }],
            last_page: 1,
            summary: null
          };
          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response }));
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);
      const stalePromise = store.dispatch(getPurchaseDetailsByItemRows({}));
      await flushPromises();
      await store.dispatch(getPurchaseDetailsByItemRows({}));
      resolveAPage1();
      await stalePromise;
      await flushPromises();

      expect(capturedPages).not.toContain(2);
    });

    it("drops a stale RECEIVE when a newer call supersedes it", async () => {
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
            return new Promise((resolve) => {
              resolveFirstPage = () => resolve({ response });
            });
          }
          return Promise.resolve({ response });
        }
      );

      const store = mockStore(MOCK_STATE);
      const stalePromise = store.dispatch(getPurchaseDetailsByItemRows({}));
      await flushPromises();
      await store.dispatch(getPurchaseDetailsByItemRows({}));
      await flushPromises();
      resolveFirstPage();
      await stalePromise;
      await flushPromises();

      const rowsActions = store
        .getActions()
        .filter((a) => a.type === RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS);
      expect(rowsActions).toHaveLength(1);
      expect(rowsActions[0].payload.response.data).toEqual([{ id: "fresh" }]);
    });

    it("drops the whole-set commit when the summit changes mid-flight (nothing re-invokes By Item to bump the seq)", async () => {
      // The seq guard is per-thunk, not summit-aware, and a summit switch remounts
      // on Orders — it never re-invokes By Item, so the seq is NOT bumped. Without
      // the explicit summit guard the parked in-flight fetch would commit the old
      // summit's rows over the reset slice (a stale cross-summit false cache hit).
      let resolvePage1;
      getRequest.mockImplementation(() => () => () => {
        const response = {
          data: [{ id: "old-summit" }],
          last_page: 1,
          summary: null
        };
        return new Promise((resolve) => {
          resolvePage1 = () => resolve({ response });
        });
      });

      // Function-backed getState so the summit id can flip under the in-flight thunk.
      let summitId = 42;
      const store = mockStore(() => ({
        currentSummitState: { currentSummit: { id: summitId } }
      }));
      const pending = store.dispatch(getPurchaseDetailsByItemRows({}));
      await flushPromises();
      // Summit switches; no new By Item dispatch bumps the seq.
      summitId = 43;
      resolvePage1();
      await pending;
      await flushPromises();

      const rowsActions = store
        .getActions()
        .filter((a) => a.type === RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS);
      expect(rowsActions).toHaveLength(0);
      // The summit-bail must leave the global overlay CLEARED — otherwise a
      // startLoading dispatched under the old summit sticks (the reducer sets
      // loading to a flag, so nothing after it clears it). Assert the terminal
      // loading transition is a stop, not just balanced counts.
      const loadingActions = store
        .getActions()
        .filter((a) => a.type === START_LOADING || a.type === STOP_LOADING);
      expect(loadingActions.at(-1)?.type).toBe(STOP_LOADING);
    });

    it("suppresses PURCHASE_DETAILS_BY_ITEM_READ_ERROR from a stale call's error handler", async () => {
      let fireStaleError;
      let callNum = 0;
      getRequest.mockImplementation(
        (_requestAC, receiveActionCreator, _url, errorHandler) =>
          () =>
          (guardedOrDispatch) => {
            callNum += 1;
            if (callNum === 1) {
              // A's page 1 stays IN FLIGHT until fireStaleError, which routes a
              // 403 through the error handler via A's guardedDispatch (stale →
              // suppressed) and resolves with NO {response} → A's destructure
              // then throws a TypeError → catch also guarded.
              return new Promise((resolve) => {
                fireStaleError = () => {
                  errorHandler({ status: 403 }, {})(guardedOrDispatch);
                  resolve();
                };
              });
            }
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
      const stalePromise = store.dispatch(getPurchaseDetailsByItemRows({}));
      // A is now past the token guard with its page-1 request in flight.
      await flushPromises();
      await store.dispatch(getPurchaseDetailsByItemRows({}));
      fireStaleError();
      await stalePromise;
      await flushPromises();

      const errors = store
        .getActions()
        .filter((a) => a.type === PURCHASE_DETAILS_BY_ITEM_READ_ERROR);
      expect(errors).toHaveLength(0);
      const receives = store
        .getActions()
        .filter((a) => a.type === RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS);
      expect(receives).toHaveLength(1);
      expect(receives[0].payload.response.data).toEqual([{ id: "fresh" }]);
    });
  });
});
