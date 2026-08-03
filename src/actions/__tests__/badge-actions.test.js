/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { saveBadgeSettings } from "../badge-actions";
import { saveMarketingSetting } from "../marketing-actions";

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
    saveMarketingSetting.mockImplementation(() => () => Promise.resolve());

    const store = mockStore({});
    await expect(
      store.dispatch(
        saveBadgeSettings({
          a: { id: 1, type: "TEXT", value: "x", updated: true },
          b: { id: 2, type: "TEXT", value: "y", updated: true }
        })
      )
    ).resolves.toBeDefined();
  });
});
