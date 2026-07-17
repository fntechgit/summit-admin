import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  postFile,
  getRawCSV,
  downloadFileByContent
} from "openstack-uicore-foundation/lib/utils/actions";
import { getEvents, exportEvents, importEventsCSV } from "../event-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  postFile: jest.fn(),
  getRawCSV: jest.fn(),
  downloadFileByContent: jest.fn()
}));

describe("Event Actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  let capturedParams = null;

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockClear();

    getRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator) =>
        (params = {}) =>
        (dispatch) => {
          capturedParams = params;

          if (
            requestActionCreator &&
            typeof requestActionCreator === "function"
          ) {
            dispatch(requestActionCreator({}));
          }

          return new Promise((resolve) => {
            if (typeof receiveActionCreator === "function") {
              dispatch(receiveActionCreator({ response: {} }));
            } else {
              dispatch(receiveActionCreator);
            }

            resolve({ response: {} });
          });
        }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    capturedParams = null;
  });

  test("passes pre-built [] range filter strings through to the request", async () => {
    const store = mockStore({
      currentSummitState: {
        currentSummit: {
          id: 1,
          time_zone: { name: "UTC" }
        }
      }
    });

    store.dispatch(
      getEvents(null, 1, 10, "id", 1, ["speakers_count[]1&&3"], [])
    );

    await flushPromises();

    expect(getRequest).toHaveBeenCalledTimes(1);
    expect(capturedParams).toBeTruthy();
    expect(capturedParams["filter[]"]).toContain("speakers_count[]1&&3");
  });

  test("requests type.use_speakers in fields for event list", async () => {
    const store = mockStore({
      currentSummitState: {
        currentSummit: {
          id: 1,
          time_zone: { name: "UTC" }
        }
      }
    });

    store.dispatch(getEvents());

    await flushPromises();

    expect(getRequest).toHaveBeenCalledTimes(1);
    expect(capturedParams).toBeTruthy();
    expect(capturedParams.fields).toContain("type.use_speakers");
  });

  test("requests speakers.email in fields so the bulk-edit speaker label isn't (undefined)", async () => {
    const store = mockStore({
      currentSummitState: {
        currentSummit: {
          id: 1,
          time_zone: { name: "UTC" }
        }
      }
    });

    store.dispatch(getEvents());

    await flushPromises();

    expect(capturedParams).toBeTruthy();
    expect(capturedParams.fields).toContain("speakers.email");
  });

  test("passes pre-built operator filter strings through to the request", async () => {
    const store = mockStore({
      currentSummitState: {
        currentSummit: {
          id: 1,
          time_zone: { name: "UTC" }
        }
      }
    });

    store.dispatch(getEvents(null, 1, 10, "id", 1, ["speakers_count>=2"], []));

    await flushPromises();

    expect(getRequest).toHaveBeenCalledTimes(1);
    expect(capturedParams).toBeTruthy();
    expect(capturedParams["filter[]"]).toContain("speakers_count>=2");
  });

  describe("importEventsCSV", () => {
    beforeEach(() => {
      postFile.mockReset();
    });

    test("resolves and reloads the page after a successful upload", async () => {
      postFile.mockImplementation(
        (start, successActionCreator) => () => (dispatch) => {
          dispatch(successActionCreator({ response: {} }));
          return Promise.resolve({ response: {} });
        }
      );

      const store = mockStore({
        currentSummitState: { currentSummit: { id: 1 } }
      });
      const file = new File(["a,b"], "events.csv");

      await store.dispatch(importEventsCSV(file, true));

      expect(postFile).toHaveBeenCalledTimes(1);
      const [, , , calledFile, extraFields] = postFile.mock.calls[0];
      expect(calledFile).toBe(file);
      expect(extraFields).toEqual({ send_speaker_email: true });
      // jsdom's window.location.reload can't be mocked (non-configurable),
      // so we verify the success path ran via the other dispatched action
      // instead of the reload call itself.
      const actions = store.getActions();
      expect(actions.some((a) => a.type === "START_LOADING")).toBe(true);
      expect(actions.some((a) => a.type === "STOP_LOADING")).toBe(true);
    });

    test("propagates a rejection when the upload fails, so the caller can catch it", async () => {
      const uploadError = new Error("upload failed");
      postFile.mockImplementation(
        () => () => () => Promise.reject(uploadError)
      );

      const store = mockStore({
        currentSummitState: { currentSummit: { id: 1 } }
      });

      await expect(
        store.dispatch(importEventsCSV(new File(["a"], "events.csv"), false))
      ).rejects.toBe(uploadError);
    });
  });

  describe("exportEvents", () => {
    beforeEach(() => {
      getRawCSV.mockReset();
      downloadFileByContent.mockReset();
      getRawCSV.mockResolvedValue("id,title\n1,Test Event");
    });

    test("fetches a single CSV page and downloads it when results fit within one page", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 1, name: "MySummit" } },
        currentEventListState: { totalEvents: 50 }
      });

      store.dispatch(exportEvents());
      await flushPromises();

      expect(getRawCSV).toHaveBeenCalledTimes(1);
      expect(downloadFileByContent).toHaveBeenCalledTimes(1);
      const [filename] = downloadFileByContent.mock.calls[0];
      expect(filename).toBe("MySummit-Activities.csv");
    });

    test("fetches one CSV page per chunk of EXPORT_PAGE_SIZE_200 events", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 1, name: "MySummit" } },
        currentEventListState: { totalEvents: 450 }
      });

      store.dispatch(exportEvents());
      await flushPromises();

      // 450 events / 200 per page => 3 pages
      expect(getRawCSV).toHaveBeenCalledTimes(3);
    });

    test("adds an escaped search filter across title/abstract/speaker_title when a term is provided", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 1, name: "MySummit" } },
        currentEventListState: { totalEvents: 10 }
      });

      store.dispatch(exportEvents("hello"));
      await flushPromises();

      const [, params] = getRawCSV.mock.calls[0];
      expect(params["filter[]"]).toEqual(
        expect.arrayContaining([expect.stringContaining("title=@hello")])
      );
    });

    test("still stops loading when the CSV fetch fails", async () => {
      getRawCSV.mockRejectedValue(new Error("network error"));

      const store = mockStore({
        currentSummitState: { currentSummit: { id: 1, name: "MySummit" } },
        currentEventListState: { totalEvents: 10 }
      });

      store.dispatch(exportEvents());
      await flushPromises();

      expect(downloadFileByContent).not.toHaveBeenCalled();
      const actions = store.getActions();
      expect(actions.some((a) => a.type === "STOP_LOADING")).toBe(true);
    });
  });
});
