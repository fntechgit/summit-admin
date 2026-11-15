/**
 * @jest-environment jsdom
 */
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  postFile,
  snackbarErrorHandler,
  START_LOADING,
  STOP_LOADING
} from "openstack-uicore-foundation/lib/utils/actions";
import { importSponsorsCSV } from "../sponsor-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  postFile: jest.fn()
}));

describe("importSponsorsCSV", () => {
  const mockStore = configureStore([thunk]);
  const originalApiBaseUrl = window.API_BASE_URL;
  const makeStore = () =>
    mockStore({ currentSummitState: { currentSummit: { id: 42 } } });
  const makeFile = () =>
    new File(["company,tier"], "s.csv", { type: "text/csv" });

  beforeEach(() => {
    window.API_BASE_URL = "http://test-api";
    jest.spyOn(methods, "getAccessTokenSafely").mockReturnValue("TOKEN");
  });

  afterEach(() => {
    window.API_BASE_URL = originalApiBaseUrl;
    jest.restoreAllMocks();
    postFile.mockReset();
  });

  it("posts the file to the summit sponsors csv endpoint with dry_run and resolves with the report", async () => {
    const report = { dry_run: true, summary: {}, rows: [] };
    const curried = jest.fn(() => () => Promise.resolve({ response: report }));
    postFile.mockImplementation(() => curried);
    const store = makeStore();
    const file = makeFile();

    await expect(
      store.dispatch(importSponsorsCSV(file, true))
    ).resolves.toEqual(report);

    const [, , url, sentFile, fields] = postFile.mock.calls[0];
    expect(url).toBe("http://test-api/api/v1/summits/42/sponsors/csv");
    expect(sentFile).toBe(file);
    expect(fields).toEqual({ dry_run: "1" });
    expect(postFile.mock.calls[0][5]).toBe(snackbarErrorHandler);
    expect(curried).toHaveBeenCalledWith({ access_token: "TOKEN" });
    expect(store.getActions().map((a) => a.type)).toEqual([
      START_LOADING,
      STOP_LOADING
    ]);
  });

  it("starts loading before the access token resolves", async () => {
    let resolveToken;
    methods.getAccessTokenSafely.mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve;
      })
    );
    postFile.mockImplementation(
      () => () => () => Promise.resolve({ response: { dry_run: true } })
    );
    const store = makeStore();

    const pending = store.dispatch(importSponsorsCSV(makeFile(), true));

    expect(store.getActions().map((a) => a.type)).toEqual([START_LOADING]);
    expect(postFile).not.toHaveBeenCalled();
    resolveToken("TOKEN");
    await pending;
    expect(postFile).toHaveBeenCalledTimes(1);
  });

  it("sends dry_run 0 for the real import", async () => {
    postFile.mockImplementation(
      () => () => () => Promise.resolve({ response: { dry_run: false } })
    );
    const store = makeStore();

    await store.dispatch(importSponsorsCSV(makeFile(), false));

    expect(postFile.mock.calls[0][4]).toEqual({ dry_run: "0" });
  });

  it("rejects and still stops loading when the request fails", async () => {
    postFile.mockImplementation(
      () => () => () => Promise.reject(new Error("boom"))
    );
    const store = makeStore();

    await expect(
      store.dispatch(importSponsorsCSV(makeFile(), true))
    ).rejects.toThrow("boom");

    const types = store.getActions().map((a) => a.type);
    expect(types[types.length - 1]).toBe(STOP_LOADING);
  });
});
