/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { postRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { saveBadgeSettings, saveBadgeFeature } from "../badge-actions";
import { saveMarketingSetting } from "../marketing-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postRequest: jest.fn()
}));

jest.mock("../marketing-actions", () => ({
  __esModule: true,
  saveMarketingSetting: jest.fn()
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

describe("saveBadgeFeature", () => {
  const mockStore = configureStore([thunk]);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("on create shows a success snackbar, stops loading and resolves with the new entity", async () => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    postRequest.mockImplementation(
      () => () => () => Promise.resolve({ response: { id: 99 } })
    );
    const store = mockStore({
      currentSummitState: { currentSummit: { id: 7 } }
    });

    const result = await store.dispatch(
      saveBadgeFeature({
        id: 0,
        name: "VIP",
        description: "d",
        template_content: "t"
      })
    );

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "SET_SNACKBAR_MESSAGE",
          payload: expect.objectContaining({ type: "success" })
        }),
        { type: "STOP_LOADING", payload: undefined }
      ])
    );
    // the edit page reads the new id from this to redirect to its edit route
    expect(result).toEqual({ response: { id: 99 } });
  });
});
