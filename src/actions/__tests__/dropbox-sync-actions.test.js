/**
 * @jest-environment jsdom
 */

import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  putRequest,
  postRequest
} from "openstack-uicore-foundation/lib/utils/actions";
import { snackbarErrorHandler } from "../base-actions";
import * as DropboxSyncActions from "../dropbox-sync-actions";
import * as methods from "../../utils/methods";
import * as MediaUploadActions from "../media-upload-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  postRequest: jest.fn()
}));

const mockRequestImpl =
  (requestActionCreator, receiveActionCreator) => () => (dispatch) => {
    if (requestActionCreator && typeof requestActionCreator === "function")
      dispatch(requestActionCreator({}));

    return new Promise((resolve) => {
      if (typeof receiveActionCreator === "function") {
        dispatch(receiveActionCreator({ response: {} }));
        resolve({ response: {} });
        return;
      }
      dispatch(receiveActionCreator);
      resolve({ response: {} });
    });
  };

const mockRequestImplReject = () => () => () =>
  Promise.reject(new Error("network error"));

describe("dropbox sync actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      currentSummitState: { currentSummit: { id: 1 } }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
    window.DROPBOX_MATERIALIZER_API_BASE_URL = "https://test-api.example.com";

    getRequest.mockImplementation(mockRequestImpl);
    putRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator) =>
        mockRequestImpl(requestActionCreator, receiveActionCreator)
    );
    postRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator) =>
        mockRequestImpl(requestActionCreator, receiveActionCreator)
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.DROPBOX_MATERIALIZER_API_BASE_URL;
  });

  test("getSyncConfig dispatches REQUEST, RECEIVE, then STOP_LOADING", async () => {
    store.dispatch(DropboxSyncActions.getSyncConfig());
    await flushPromises();

    const actions = store.getActions();
    expect(actions).toEqual([
      { payload: {}, type: "REQUEST_SYNC_CONFIG" },
      // uicore's internal receive is a DUMMY; the real commit happens through
      // the summit-guarded commitDispatch below it.
      { payload: { response: {} }, type: "DUMMY" },
      { payload: { response: {} }, type: "RECEIVE_SYNC_CONFIG" },
      { payload: undefined, type: "STOP_LOADING" }
    ]);
    expect(getRequest).toHaveBeenCalledTimes(1);
  });

  test("getSyncConfig early returns when getBaseUrl() is falsy", async () => {
    window.DROPBOX_MATERIALIZER_API_BASE_URL = "";

    store.dispatch(DropboxSyncActions.getSyncConfig());
    await flushPromises();

    expect(store.getActions()).toEqual([]);
    expect(getRequest).not.toHaveBeenCalled();
    expect(methods.getAccessTokenSafely).not.toHaveBeenCalled();
  });

  test("getSyncConfig early returns when summitId is missing", async () => {
    store = configureStore([thunk])({
      currentSummitState: { currentSummit: {} }
    });

    store.dispatch(DropboxSyncActions.getSyncConfig());
    await flushPromises();

    expect(store.getActions()).toEqual([]);
    expect(getRequest).not.toHaveBeenCalled();
    expect(methods.getAccessTokenSafely).not.toHaveBeenCalled();
  });

  test("updateSyncConfig dispatches START_LOADING, REQUEST_SYNC_CONFIG, SYNC_CONFIG_UPDATED, STOP_LOADING", async () => {
    store.dispatch(
      DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
    );
    await flushPromises();

    const actions = store.getActions();
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    // REQUEST_SYNC_CONFIG is dispatched by the thunk itself (pre-token, before
    // putRequest) so dropboxSyncState.loading covers the full save duration
    // and the Save/toggle/Rebuild disabled guards block overlapping saves.
    expect(actions[1]).toEqual({ payload: {}, type: "REQUEST_SYNC_CONFIG" });
    // uicore's internal receive is a DUMMY; the commit is summit-guarded.
    expect(actions[2]).toEqual({ payload: { response: {} }, type: "DUMMY" });
    expect(actions[3]).toEqual({
      payload: { response: {} },
      type: "SYNC_CONFIG_UPDATED"
    });
    expect(actions[4]).toEqual({ payload: undefined, type: "STOP_LOADING" });
    expect(putRequest).toHaveBeenCalledTimes(1);
  });

  test("getSyncConfig gates BEFORE the token await: REQUEST_SYNC_CONFIG is dispatched synchronously", () => {
    // The mount GET must flip syncLoading immediately so the toggle/Save/
    // Rebuild guards disable mutations for the GET's whole duration — a PUT
    // started during a slow token refresh could otherwise interleave with
    // the GET (early flag clear, or a stale GET overwriting the PUT's config).
    store.dispatch(DropboxSyncActions.getSyncConfig());

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain("REQUEST_SYNC_CONFIG");
    expect(getRequest).not.toHaveBeenCalled();
  });

  test("updateSyncConfig gates BEFORE the token await: START_LOADING + REQUEST_SYNC_CONFIG are dispatched synchronously", () => {
    // No flushPromises: a slow token refresh must not leave a window where
    // Save/toggle are still enabled (dropboxSyncState.loading false) and a
    // second click can start an overlapping PUT.
    store.dispatch(
      DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
    );

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain("START_LOADING");
    expect(types).toContain("REQUEST_SYNC_CONFIG");
    // The PUT itself has not started yet (token still pending).
    expect(putRequest).not.toHaveBeenCalled();
  });

  // Request-identity guard: getSyncConfig/updateSyncConfig share a sequence;
  // only the newest invocation for the still-current summit may commit.
  describe("sync-config request-identity guard", () => {
    // Deferred mock that emulates the real uicore contract: on resolution it
    // dispatches the receive action creator through the dispatch it was
    // handed, THEN resolves. Without that emulation these tests would pass
    // vacuously against pre-guard code, which relied on uicore dispatching
    // the receive creator internally.
    const deferredRequestImpl =
      (register) =>
      (requestActionCreator, receiveActionCreator) =>
      () =>
      (dispatch) =>
        new Promise((resolve, reject) => {
          if (
            requestActionCreator &&
            typeof requestActionCreator === "function"
          )
            dispatch(requestActionCreator({}));
          register({
            resolve: (payload) => {
              if (typeof receiveActionCreator === "function")
                dispatch(receiveActionCreator(payload));
              resolve(payload);
            },
            reject
          });
        });

    test("stale GET response for a previous summit is NOT committed after a summit switch", async () => {
      let currentState = { currentSummitState: { currentSummit: { id: 1 } } };
      const gStore = mockStore(() => currentState);
      let inFlight;
      getRequest.mockImplementation(
        deferredRequestImpl((handle) => {
          inFlight = handle;
        })
      );

      gStore.dispatch(DropboxSyncActions.getSyncConfig());
      await flushPromises();
      expect(getRequest).toHaveBeenCalledTimes(1);

      // Summit switch while the response is in flight.
      currentState = { currentSummitState: { currentSummit: { id: 2 } } };
      inFlight.resolve({
        response: { summit_id: 1, dropbox_sync_enabled: true }
      });
      await flushPromises();

      // Summit 1's config must not repopulate summit 2's slice.
      const types = gStore.getActions().map((a) => a.type);
      expect(types).not.toContain("RECEIVE_SYNC_CONFIG");
    });

    test("superseded GET's failure does not clear the newer GET's loading flag (identical-key abort)", async () => {
      let rejectA;
      let resolveB;
      getRequest
        .mockImplementationOnce(
          () => () => () =>
            new Promise((_resolve, reject) => {
              rejectA = reject;
            })
        )
        .mockImplementationOnce(
          () => () => () =>
            new Promise((resolve) => {
              resolveB = resolve;
            })
        );

      store.dispatch(DropboxSyncActions.getSyncConfig()); // A
      await flushPromises();
      store.dispatch(DropboxSyncActions.getSyncConfig()); // B supersedes A
      await flushPromises();

      // uicore aborts A when B fires with the identical token-stripped key;
      // A's catch must NOT dispatch RECEIVE_SYNC_CONFIG({}) — that would
      // clear loading (and wipe the config) while B is still in flight.
      rejectA(new Error("aborted"));
      await flushPromises();
      let types = store.getActions().map((a) => a.type);
      expect(types.filter((t) => t === "RECEIVE_SYNC_CONFIG")).toHaveLength(0);

      resolveB({ response: { summit_id: 1 } });
      await flushPromises();
      types = store.getActions().map((a) => a.type);
      expect(types.filter((t) => t === "RECEIVE_SYNC_CONFIG")).toHaveLength(1);
    });

    test("PUT superseded by a GET that bails on summit switch: the inherited overlay is still cleared", async () => {
      // The superseded PUT's terminal dispatches are sequence-suppressed and
      // the superseding GET never started the overlay — the GET's bail path
      // is the only live party that can clear it.
      let currentState = { currentSummitState: { currentSummit: { id: 1 } } };
      const gStore = mockStore(() => currentState);
      putRequest.mockImplementation(deferredRequestImpl(() => {}));
      let resolveTokenB;
      methods.getAccessTokenSafely
        .mockReturnValueOnce("TOKEN") // PUT A
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveTokenB = resolve;
          })
        ); // GET B

      gStore.dispatch(
        DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
      );
      await flushPromises(); // A past its token; PUT in flight; overlay started
      gStore.dispatch(DropboxSyncActions.getSyncConfig()); // B supersedes A, token pending
      // Summit switches while B awaits its token.
      currentState = { currentSummitState: { currentSummit: { id: 2 } } };
      const stopsBefore = gStore
        .getActions()
        .filter((a) => a.type === "STOP_LOADING").length;

      resolveTokenB("TOKEN");
      await flushPromises(); // B bails (newest, summit switched)

      const stopsAfter = gStore
        .getActions()
        .filter((a) => a.type === "STOP_LOADING").length;
      expect(stopsAfter).toBe(stopsBefore + 1);
      expect(getRequest).not.toHaveBeenCalled(); // B really bailed pre-HTTP
    });

    test("superseded PUT that succeeded triggers a same-summit refetch so redux converges", async () => {
      // A GET issued after the PUT was sent can be answered with the PRE-save
      // snapshot; with the PUT's own commit suppressed, redux would hold
      // stale config indefinitely without the convergence refetch.
      const getHandles = [];
      const putHandles = [];
      getRequest.mockImplementation(
        deferredRequestImpl((h) => getHandles.push(h))
      );
      putRequest.mockImplementation(
        deferredRequestImpl((h) => putHandles.push(h))
      );

      store.dispatch(
        DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
      ); // PUT A
      await flushPromises();
      store.dispatch(DropboxSyncActions.getSyncConfig()); // GET B supersedes A
      await flushPromises();
      expect(getRequest).toHaveBeenCalledTimes(1);

      putHandles[0].resolve({
        response: { summit_id: 1, dropbox_sync_enabled: true }
      }); // A succeeds server-side; its commit is suppressed
      await flushPromises();
      const types = store.getActions().map((a) => a.type);
      expect(types).not.toContain("SYNC_CONFIG_UPDATED");
      // The convergence refetch (GET C) fired.
      expect(getRequest).toHaveBeenCalledTimes(2);

      // B answers with the PRE-save snapshot — superseded by C, not committed.
      getHandles[0].resolve({
        response: { summit_id: 1, dropbox_sync_enabled: false }
      });
      await flushPromises();
      expect(
        store.getActions().filter((a) => a.type === "RECEIVE_SYNC_CONFIG")
      ).toHaveLength(0);

      // C answers with the post-save state — the one commit that lands.
      getHandles[1].resolve({
        response: { summit_id: 1, dropbox_sync_enabled: true }
      });
      await flushPromises();
      const receives = store
        .getActions()
        .filter((a) => a.type === "RECEIVE_SYNC_CONFIG");
      expect(receives).toHaveLength(1);
      expect(receives[0].payload.response.dropbox_sync_enabled).toBe(true);
    });

    test("stale PUT response is NOT committed after a summit switch (but its overlay is still cleared)", async () => {
      let currentState = { currentSummitState: { currentSummit: { id: 1 } } };
      const gStore = mockStore(() => currentState);
      let inFlight;
      putRequest.mockImplementation(
        deferredRequestImpl((handle) => {
          inFlight = handle;
        })
      );

      gStore.dispatch(
        DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
      );
      await flushPromises();
      currentState = { currentSummitState: { currentSummit: { id: 2 } } };
      inFlight.resolve({
        response: { summit_id: 1, dropbox_sync_enabled: true }
      });
      await flushPromises();

      const types = gStore.getActions().map((a) => a.type);
      expect(types).not.toContain("SYNC_CONFIG_UPDATED");
      // Still the newest invocation, so the overlay it started is cleared.
      expect(types).toContain("STOP_LOADING");
    });
  });

  test("rebuildSync dispatches START_LOADING, REBUILD_SYNC_DISPATCHED, STOP_LOADING", async () => {
    store.dispatch(DropboxSyncActions.rebuildSync());
    await flushPromises();

    const actions = store.getActions();
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    expect(actions[1]).toEqual({
      payload: { response: {} },
      type: "REBUILD_SYNC_DISPATCHED"
    });
    expect(actions[2]).toEqual({ payload: undefined, type: "STOP_LOADING" });
    expect(postRequest).toHaveBeenCalledTimes(1);
  });

  test("resyncRoom dispatches START_LOADING, RESYNC_ROOM_DISPATCHED, STOP_LOADING", async () => {
    store.dispatch(DropboxSyncActions.resyncRoom("Main Venue", "Room A"));
    await flushPromises();

    const actions = store.getActions();
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    expect(actions[1]).toEqual({
      payload: { response: {} },
      type: "RESYNC_ROOM_DISPATCHED"
    });
    expect(actions[2]).toEqual({ payload: undefined, type: "STOP_LOADING" });
    expect(postRequest).toHaveBeenCalled();
  });

  test("getSyncConfig dispatches RECEIVE_SYNC_CONFIG with empty payload on failure", async () => {
    getRequest.mockImplementation(mockRequestImplReject);

    store.dispatch(DropboxSyncActions.getSyncConfig());
    await flushPromises();

    const actions = store.getActions();
    // REQUEST (pre-token) then RECEIVE({}) from the catch: loading is set and
    // then cleared even when the GET fails — no stranded flag.
    expect(actions).toEqual([
      { payload: {}, type: "REQUEST_SYNC_CONFIG" },
      { payload: {}, type: "RECEIVE_SYNC_CONFIG" }
    ]);
  });

  test("updateSyncConfig on failure: loading is set (REQUEST) and then cleared (SYNC_CONFIG_ERROR), no deadlock", async () => {
    putRequest.mockImplementation(() => mockRequestImplReject());

    store.dispatch(
      DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
    );
    await flushPromises();

    const actions = store.getActions();
    // REQUEST_SYNC_CONFIG comes from the thunk's own pre-token dispatch, so
    // it fires even though the reject mock bypasses uicore's request action —
    // this pins that a failed save cannot strand dropboxSyncState.loading.
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    expect(actions[1]).toEqual({ payload: {}, type: "REQUEST_SYNC_CONFIG" });
    expect(actions[2]).toEqual({ payload: undefined, type: "STOP_LOADING" });
    // Clears the loading flag without resetting the stored syncConfig.
    expect(actions[3]).toEqual({ payload: {}, type: "SYNC_CONFIG_ERROR" });
  });

  test("rebuildSync dispatches STOP_LOADING on failure", async () => {
    postRequest.mockImplementation(() => mockRequestImplReject());

    store.dispatch(DropboxSyncActions.rebuildSync());
    await flushPromises();

    const actions = store.getActions();
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    expect(actions[1]).toEqual({ payload: undefined, type: "STOP_LOADING" });
  });

  test("resyncRoom dispatches STOP_LOADING on failure", async () => {
    postRequest.mockImplementation(() => mockRequestImplReject());

    store.dispatch(DropboxSyncActions.resyncRoom("Main Venue", "Room A"));
    await flushPromises();

    const actions = store.getActions();
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    expect(actions[1]).toEqual({ payload: undefined, type: "STOP_LOADING" });
  });
});

// ─── getAllMediaUploadTypesForAllowlist ───────────────────────────────────────
describe("getAllMediaUploadTypesForAllowlist", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    store = mockStore({
      currentSummitState: { currentSummit: { id: 1 } }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
    window.API_BASE_URL = "https://summit-api.example.com";
    window.DROPBOX_MATERIALIZER_API_BASE_URL = "https://test-api.example.com";
    // Default mock — individual tests override as needed
    getRequest.mockImplementation(
      () => () => () =>
        Promise.resolve({ response: { data: [], last_page: 1 } })
    );
    putRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator) => () => (dispatch) => {
        if (requestActionCreator && typeof requestActionCreator === "function")
          dispatch(requestActionCreator({}));
        return new Promise((resolve) => {
          if (typeof receiveActionCreator === "function") {
            dispatch(receiveActionCreator({ response: {} }));
            resolve({ response: {} });
            return;
          }
          resolve({ response: {} });
        });
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete window.API_BASE_URL;
    delete window.DROPBOX_MATERIALIZER_API_BASE_URL;
  });

  it("single page: one HTTP call (page=1, per_page=MAX_PER_PAGE, fields=id,name,private_storage_type), one RECEIVE dispatch with the raw array (SDS:918)", async () => {
    const capturedCalls = [];
    getRequest.mockImplementation((req, rec, url) => (params) => {
      capturedCalls.push({ url, params });
      return () =>
        Promise.resolve({
          response: { data: [{ id: 1 }, { id: 2 }], last_page: 1 }
        });
    });

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    expect(capturedCalls).toHaveLength(1);
    expect(capturedCalls[0].url).toBe(
      "https://summit-api.example.com/api/v1/summits/1/media-upload-types"
    );
    expect(capturedCalls[0].params).toMatchObject({
      page: 1,
      per_page: 100,
      fields: "id,name,private_storage_type"
    });

    const receives = store
      .getActions()
      .filter((a) => a.type === "RECEIVE_ALLOWLIST_OPTIONS");
    expect(receives).toHaveLength(1);
    expect(receives[0].payload).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("multi page (last_page=3, page 2 delayed to resolve AFTER page 3): exactly 3 calls, ONE RECEIVE dispatch, entries concatenated in PAGE order (SDS:919)", async () => {
    let page2Resolve;
    const page2Promise = new Promise((resolve) => {
      page2Resolve = resolve;
    });

    getRequest.mockImplementation(() => (params) => () => {
      if (params.page === 1)
        return Promise.resolve({
          response: { data: [{ id: 1 }], last_page: 3 }
        });
      if (params.page === 2) return page2Promise;
      return Promise.resolve({
        response: { data: [{ id: 3 }], last_page: 3 }
      });
    });

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises(); // page 1 and page 3 resolve; page 2 still pending

    expect(
      store.getActions().filter((a) => a.type === "RECEIVE_ALLOWLIST_OPTIONS")
    ).toHaveLength(0);

    page2Resolve({ response: { data: [{ id: 2 }], last_page: 3 } });
    await flushPromises();

    expect(getRequest).toHaveBeenCalledTimes(3);
    const receives = store
      .getActions()
      .filter((a) => a.type === "RECEIVE_ALLOWLIST_OPTIONS");
    expect(receives).toHaveLength(1);
    expect(receives[0].payload).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it("brackets the run with global startLoading/stopLoading (happy path)", async () => {
    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types[0]).toBe("START_LOADING");
    expect(types[types.length - 1]).toBe("STOP_LOADING");
  });

  it("missing/zero summit id: returns Promise.resolve() WITHOUT dispatching anything — currentSummit defaults to a truthy {id: 0} entity (current-summit-reducer DEFAULT_ENTITY), so a bare truthy check would fetch summit 0", async () => {
    store = mockStore({
      currentSummitState: { currentSummit: { id: 0 } }
    });

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    expect(store.getActions()).toEqual([]);
    expect(getRequest).not.toHaveBeenCalled();
    expect(methods.getAccessTokenSafely).not.toHaveBeenCalled();
  });

  it("summit switched mid-flight (success path, single-page): page resolves AFTER the summit id changed → RECEIVE not dispatched", async () => {
    let summitId = 1;
    const dispatched = [];
    const mockGetState = () => ({
      currentSummitState: { currentSummit: { id: summitId } }
    });
    const mockDispatch = jest.fn((action) =>
      typeof action === "function"
        ? action(mockDispatch, mockGetState)
        : dispatched.push(action)
    );

    let pageResolve;
    getRequest.mockImplementation(
      () => () => () =>
        new Promise((resolve) => {
          pageResolve = resolve;
        })
    );

    const thunkFn = DropboxSyncActions.getAllMediaUploadTypesForAllowlist();
    thunkFn(mockDispatch, mockGetState);
    await flushPromises(); // token resolves, page 1 called but pending

    summitId = 2; // switch summit

    pageResolve({ response: { data: [{ id: 1 }], last_page: 1 } });
    await flushPromises();

    const types = dispatched.map((a) => a.type);
    expect(types).not.toContain("RECEIVE_ALLOWLIST_OPTIONS");
    expect(types).toContain("STOP_LOADING"); // isNewest=true → stopLoading fires
  });

  it("summit switched mid-flight (success path, multi-page): fan-out resolves after the switch → RECEIVE not dispatched with the stale accumulation", async () => {
    let summitId = 1;
    const dispatched = [];
    const mockGetState = () => ({
      currentSummitState: { currentSummit: { id: summitId } }
    });
    const mockDispatch = jest.fn((action) =>
      typeof action === "function"
        ? action(mockDispatch, mockGetState)
        : dispatched.push(action)
    );

    const fanOutResolvers = [];
    getRequest.mockImplementation(() => (params) => () => {
      if (params.page === 1)
        return Promise.resolve({
          response: { data: [{ id: 1 }], last_page: 3 }
        });
      return new Promise((resolve) => {
        fanOutResolvers.push(resolve);
      });
    });

    const thunkFn = DropboxSyncActions.getAllMediaUploadTypesForAllowlist();
    thunkFn(mockDispatch, mockGetState);
    await flushPromises(); // page 1 resolves, fan-out starts (pages 2+3 pending)

    expect(fanOutResolvers).toHaveLength(2);
    summitId = 2; // switch summit before fan-out resolves

    fanOutResolvers.forEach((r) =>
      r({ response: { data: [{ id: 99 }], last_page: 3 } })
    );
    await flushPromises();

    const types = dispatched.map((a) => a.type);
    expect(types).not.toContain("RECEIVE_ALLOWLIST_OPTIONS");
    expect(types).toContain("STOP_LOADING");
  });

  it("summit switched mid-flight (REJECTION path): a page REJECTS after the switch → ERROR not dispatched either (the reset slice must not gain a stale error) — the fixture must actually reject or the assertion is vacuous", async () => {
    let summitId = 1;
    const dispatched = [];
    const mockGetState = () => ({
      currentSummitState: { currentSummit: { id: summitId } }
    });
    const mockDispatch = jest.fn((action) =>
      typeof action === "function"
        ? action(mockDispatch, mockGetState)
        : dispatched.push(action)
    );

    let pageReject;
    getRequest.mockImplementation(
      () => () => () =>
        new Promise((_, reject) => {
          pageReject = reject;
        })
    );

    const thunkFn = DropboxSyncActions.getAllMediaUploadTypesForAllowlist();
    thunkFn(mockDispatch, mockGetState);
    await flushPromises(); // token resolves, page 1 called but pending

    summitId = 2; // switch summit

    pageReject(new Error("network error")); // page rejects AFTER switch
    await flushPromises();

    const types = dispatched.map((a) => a.type);
    expect(types).not.toContain("ALLOWLIST_OPTIONS_ERROR");
    expect(types).toContain("STOP_LOADING"); // isNewest=true
  });

  it("A→B→A superseded invocation: hold invocation 1's pages, start invocation 2 for the SAME summit, resolve invocation 1 → its RECEIVE and stopLoading are suppressed by the sequence token even though the summit id matches; only invocation 2's dispatches land", async () => {
    let callCount = 0;
    let inv1Resolve;

    getRequest.mockImplementation(() => () => () => {
      callCount++;
      if (callCount === 1) {
        return new Promise((resolve) => {
          inv1Resolve = resolve;
        });
      }
      return Promise.resolve({
        response: { data: [{ id: "inv2" }], last_page: 1 }
      });
    });

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises(); // inv 1 awaiting page 1

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises(); // inv 2 completes

    const actionsAfterInv2 = store.getActions().length;

    inv1Resolve({ response: { data: [{ id: "inv1" }], last_page: 1 } });
    await flushPromises();

    // Inv 1 dispatched nothing new — both RECEIVE and stopLoading suppressed
    expect(store.getActions()).toHaveLength(actionsAfterInv2);

    const receives = store
      .getActions()
      .filter((a) => a.type === "RECEIVE_ALLOWLIST_OPTIONS");
    expect(receives).toHaveLength(1);
    expect(receives[0].payload).toEqual([{ id: "inv2" }]);
  });

  it("summit switched with NO newer invocation: the stale invocation's RECEIVE/ERROR are suppressed BUT its stopLoading still fires (seq-only loading tier) — the overlay is not stranded", async () => {
    let summitId = 1;
    const dispatched = [];
    const mockGetState = () => ({
      currentSummitState: { currentSummit: { id: summitId } }
    });
    const mockDispatch = jest.fn((action) =>
      typeof action === "function"
        ? action(mockDispatch, mockGetState)
        : dispatched.push(action)
    );

    let pageResolve;
    getRequest.mockImplementation(
      () => () => () =>
        new Promise((resolve) => {
          pageResolve = resolve;
        })
    );

    const thunkFn = DropboxSyncActions.getAllMediaUploadTypesForAllowlist();
    thunkFn(mockDispatch, mockGetState);
    await flushPromises(); // token resolves, page 1 pending

    summitId = 2; // switch summit — NO new invocation

    pageResolve({ response: { data: [{ id: 1 }], last_page: 1 } });
    await flushPromises();

    const types = dispatched.map((a) => a.type);
    expect(types).not.toContain("RECEIVE_ALLOWLIST_OPTIONS");
    expect(types).toContain("STOP_LOADING"); // isNewest=true → still fires
  });

  it("superseded invocation's QUEUED fan-out pages never fire an HTTP call (count getRequest invocations) — a stale identical-key request would abort the fresh invocation's in-flight page", async () => {
    // last_page=12: range(2,12,1) = 11 fan-out items
    // pLimit(TEN): 10 start immediately (pages 2..11), page 12 queued
    const LAST_PAGE = 12;
    const holdResolves = [];
    let callCount = 0;

    getRequest.mockImplementation(() => () => () => {
      callCount++;
      const currentCall = callCount;
      if (currentCall === 1) {
        return Promise.resolve({
          response: { data: [], last_page: LAST_PAGE }
        });
      }
      if (currentCall >= 2 && currentCall <= 11) {
        return new Promise((resolve) => {
          holdResolves.push(resolve);
        });
      }
      // currentCall === 12: inv 2's page 1 — never resolved in this test
      if (currentCall === 12) return new Promise(() => {});
      // Should NOT be reached — inv 1's queued page 12 must be suppressed
      return Promise.resolve({ response: { data: [], last_page: 1 } });
    });

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();
    // Page 1 resolved, 10 pooled pages started (calls 2..11), page 12 queued
    expect(callCount).toBe(11);

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();
    // Inv 2's page 1 called (call 12)
    expect(callCount).toBe(12);

    // Release one pooled page → pLimit dequeues page 12 callback
    // But stillCurrent()=false → returns empty placeholder, no getRequest call
    holdResolves[0]({ response: { data: [], last_page: LAST_PAGE } });
    await flushPromises();

    expect(callCount).toBe(12); // page 12 of inv 1 did NOT fire
  });

  it("a superseded invocation dispatches NO stopLoading after being superseded (newest-clears invariant; getRequest receives the seq-guarded dispatch, so authErrorHandler's unconditional stopLoading is also suppressed)", async () => {
    let callCount = 0;
    let inv1Resolve;

    getRequest.mockImplementation(() => () => () => {
      callCount++;
      if (callCount === 1) {
        return new Promise((resolve) => {
          inv1Resolve = resolve;
        });
      }
      return Promise.resolve({ response: { data: [], last_page: 1 } });
    });

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises(); // inv 1 awaiting page 1

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises(); // inv 2 completes

    const actionsAfterInv2 = store.getActions().length;

    inv1Resolve({ response: { data: [], last_page: 1 } });
    await flushPromises();

    // Inv 1 dispatched no STOP_LOADING (isNewest=false)
    const newActions = store.getActions().slice(actionsAfterInv2);
    expect(newActions.map((a) => a.type)).not.toContain("STOP_LOADING");
  });

  it("handler identity pin: every getRequest call is constructed with snackbarErrorHandler, and a rejected page still ends with the ERROR action (does NOT exercise snackbar delivery — the mock rejects before the handler runs)", async () => {
    getRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("Unauthorized"))
    );

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    expect(getRequest.mock.calls.length).toBeGreaterThan(0);
    getRequest.mock.calls.forEach((call) => {
      expect(call[3]).toBe(snackbarErrorHandler);
    });

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain("ALLOWLIST_OPTIONS_ERROR");
  });

  it("page-1 failure: REQUEST then ERROR, RECEIVE never dispatched", async () => {
    getRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("network error"))
    );

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain("REQUEST_ALLOWLIST_OPTIONS");
    expect(types).toContain("ALLOWLIST_OPTIONS_ERROR");
    expect(types).not.toContain("RECEIVE_ALLOWLIST_OPTIONS");
  });

  it("mid-fan-out failure (page 2 rejects, pages 1+3 succeed): ERROR dispatched, RECEIVE never dispatched with any partial list", async () => {
    getRequest.mockImplementation(() => (params) => () => {
      if (params.page === 1)
        return Promise.resolve({
          response: { data: [{ id: 1 }], last_page: 3 }
        });
      if (params.page === 2) return Promise.reject(new Error("page 2 error"));
      return Promise.resolve({
        response: { data: [{ id: 3 }], last_page: 3 }
      });
    });

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    const types = store.getActions().map((a) => a.type);
    expect(types).not.toContain("RECEIVE_ALLOWLIST_OPTIONS");
    expect(types).toContain("ALLOWLIST_OPTIONS_ERROR");
  });

  it("a rejected page never produces a RECEIVE whose payload is undefined or non-array", async () => {
    getRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("error"))
    );

    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    const receives = store
      .getActions()
      .filter((a) => a.type === "RECEIVE_ALLOWLIST_OPTIONS");
    expect(receives).toHaveLength(0);
    // Belt-and-suspenders: any accidentally-slipped-through RECEIVE must carry an array
    receives.forEach((action) => {
      expect(Array.isArray(action.payload)).toBe(true);
    });
  });

  it("dispatches NO media-upload-list action types (assert the dispatched type set is disjoint from media-upload-actions' constants)", async () => {
    store.dispatch(DropboxSyncActions.getAllMediaUploadTypesForAllowlist());
    await flushPromises();

    const dispatchedTypes = new Set(store.getActions().map((a) => a.type));
    const mediaUploadTypes = new Set(
      Object.values(MediaUploadActions).filter((v) => typeof v === "string")
    );

    dispatchedTypes.forEach((type) => {
      expect(mediaUploadTypes.has(type)).toBe(false);
    });
  });

  it("PUT-body pin (regression, passes before AND after): updateSyncConfig({materialized_media_upload_types: [...]}) forwards the key verbatim in the PUT body", async () => {
    const data = { materialized_media_upload_types: ["type-a", "type-b"] };
    store.dispatch(DropboxSyncActions.updateSyncConfig(data));
    await flushPromises();

    expect(putRequest).toHaveBeenCalledTimes(1);
    expect(putRequest.mock.calls[0][3]).toEqual(data);
  });
});
