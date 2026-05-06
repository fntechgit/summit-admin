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
import * as DropboxSyncActions from "../dropbox-sync-actions";
import * as methods from "../../utils/methods";

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

  test("updateSyncConfig dispatches START_LOADING, SYNC_CONFIG_UPDATED, STOP_LOADING", async () => {
    store.dispatch(
      DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
    );
    await flushPromises();

    const actions = store.getActions();
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    expect(actions[1]).toEqual({
      payload: { response: {} },
      type: "SYNC_CONFIG_UPDATED"
    });
    expect(actions[2]).toEqual({ payload: undefined, type: "STOP_LOADING" });
    expect(putRequest).toHaveBeenCalledTimes(1);
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
    expect(actions).toEqual([{ payload: {}, type: "RECEIVE_SYNC_CONFIG" }]);
  });

  test("updateSyncConfig dispatches STOP_LOADING on failure", async () => {
    putRequest.mockImplementation(() => mockRequestImplReject());

    store.dispatch(
      DropboxSyncActions.updateSyncConfig({ dropbox_sync_enabled: true })
    );
    await flushPromises();

    const actions = store.getActions();
    expect(actions[0]).toEqual({ payload: undefined, type: "START_LOADING" });
    expect(actions[1]).toEqual({ payload: undefined, type: "STOP_LOADING" });
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
