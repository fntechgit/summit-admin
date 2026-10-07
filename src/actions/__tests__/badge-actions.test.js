/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  deleteRequest,
  START_LOADING,
  STOP_LOADING
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  saveBadgeSettings,
  getViewTypes,
  deleteViewType,
  REQUEST_VIEW_TYPES
} from "../badge-actions";
import { saveMarketingSetting } from "../marketing-actions";
import * as methods from "../../utils/methods";

jest.mock("../marketing-actions", () => ({
  __esModule: true,
  saveMarketingSetting: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  deleteRequest: jest.fn()
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("saveBadgeSettings", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("does not settle until every fanned-out setting request has settled, then rejects with the failure", async () => {
    const early = deferred();
    const late = deferred();

    saveMarketingSetting.mockImplementation((entity) => () => {
      if (entity.key === "A") return early.promise;
      if (entity.key === "B") return late.promise;
      return Promise.resolve();
    });

    const store = mockStore({});
    let settled = false;
    const resultPromise = store.dispatch(
      saveBadgeSettings({
        a: { id: 1, type: "TEXT", value: "x", updated: true },
        b: { id: 2, type: "TEXT", value: "y", updated: true }
      })
    );
    resultPromise.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      }
    );

    early.reject(new Error("early failure"));
    await flushPromises();

    expect(settled).toBe(false);

    late.resolve({ response: {} });
    await flushPromises();

    expect(settled).toBe(true);
    await expect(resultPromise).rejects.toThrow("early failure");
  });

  it("resolves once every setting request resolves", async () => {
    saveMarketingSetting
      .mockImplementationOnce(() => () => Promise.resolve({ id: "first" }))
      .mockImplementationOnce(() => () => Promise.resolve({ id: "second" }));
    const store = mockStore({});
    await expect(
      store.dispatch(
        saveBadgeSettings({
          a: { id: 1, type: "TEXT", value: "x", updated: true },
          b: { id: 2, type: "TEXT", value: "y", updated: true }
        })
      )
    ).resolves.toEqual([{ id: "first" }, { id: "second" }]);
  });
});

describe("view type list thunks", () => {
  const mockStore = configureStore([thunk]);
  const state = { currentSummitState: { currentSummit: { id: 73 } } };

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("getViewTypes hands perPage to the list reducer, or the pager disappears", async () => {
    // emulates uicore getRequest dispatching the request action with its payload
    getRequest.mockImplementation(
      (requestAction, _receiveAction, _url, _errorHandler, payload) =>
        () =>
        (dispatch) => {
          dispatch(requestAction(payload));
          return Promise.resolve();
        }
    );
    const store = mockStore(state);

    await store.dispatch(getViewTypes("att", 2, 50, "name", -1));

    expect(
      store.getActions().find((a) => a.type === REQUEST_VIEW_TYPES).payload
    ).toEqual({ order: "name", orderDir: -1, perPage: 50, term: "att" });
  });

  it("deleteViewType stops loading and rejects on failure so callers skip the refetch", async () => {
    deleteRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("boom"))
    );
    const store = mockStore(state);

    await expect(store.dispatch(deleteViewType(5))).rejects.toThrow("boom");

    expect(store.getActions().map((a) => a.type)).toEqual([
      START_LOADING,
      STOP_LOADING
    ]);
  });
});
