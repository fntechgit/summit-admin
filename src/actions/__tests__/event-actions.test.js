import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  putRequest,
  deleteRequest,
  postFile,
  getRawCSV,
  downloadFileByContent,
  snackbarErrorHandler
} from "openstack-uicore-foundation/lib/utils/actions";
import {
  getEvent,
  getEvents,
  exportEvents,
  importEventsCSV,
  reopenSubmissionPeriod,
  closeSubmissionPeriod,
  SUBMISSION_PERIOD_REOPENED
} from "../event-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  putRequest: jest.fn(),
  deleteRequest: jest.fn(),
  postFile: jest.fn(),
  getRawCSV: jest.fn(),
  downloadFileByContent: jest.fn()
}));

describe("Event Actions", () => {
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);

  let capturedParams = null;
  // getEvent's thunk fires a second, unrelated getRequest call (QA users
  // lookup) as a side effect after its own request resolves. That call
  // reuses this same mocked getRequest and would clobber capturedParams,
  // so every call's params are also kept here in call order.
  let capturedParamsHistory = [];

  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockClear();
    putRequest.mockClear();
    deleteRequest.mockClear();
    capturedParamsHistory = [];

    getRequest.mockImplementation(
      (requestActionCreator, receiveActionCreator) =>
        (params = {}) =>
        (dispatch) => {
          capturedParams = params;
          capturedParamsHistory.push(params);

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

    putRequest.mockImplementation(
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

    deleteRequest.mockImplementation(
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

  describe("reopenSubmissionPeriod", () => {
    it("PUTs hours to the reopen endpoint for the current summit", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 7 } }
      });

      await store.dispatch(reopenSubmissionPeriod(42, 48));

      expect(putRequest).toHaveBeenCalled();
      const [, , url, payload] = putRequest.mock.calls[0];
      expect(url).toBe(
        `${window.API_BASE_URL}/api/v1/summits/7/presentations/42/submission-period/reopen`
      );
      expect(payload).toEqual({ hours: 48 });
      expect(capturedParams.access_token).toBe("TOKEN");
      expect(capturedParams.expand).toBe("submission_reopened_by");
    });

    it("dispatches SUBMISSION_PERIOD_REOPENED, not EVENT_UPDATED", async () => {
      // Guards the trap-5 regression: EVENT_UPDATED replaces the entity wholesale,
      // and this narrowly-expanded response would null out type_id/selection_plan_id.
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 7 } }
      });

      await store.dispatch(reopenSubmissionPeriod(42, 48));

      expect(store.getActions().map((a) => a.type)).toContain(
        SUBMISSION_PERIOD_REOPENED
      );
    });

    it("routes errors to snackbarErrorHandler so the API 412 text reaches the admin", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 7 } }
      });

      await store.dispatch(reopenSubmissionPeriod(42, 999));

      const [, , , , errorHandler] = putRequest.mock.calls[0];
      expect(errorHandler).toBe(snackbarErrorHandler);
    });
  });

  describe("closeSubmissionPeriod", () => {
    it("DELETEs the reopen endpoint for the current summit", async () => {
      const store = mockStore({
        currentSummitState: { currentSummit: { id: 7 } }
      });

      await store.dispatch(closeSubmissionPeriod(42));

      expect(deleteRequest).toHaveBeenCalled();
      const [, , url] = deleteRequest.mock.calls[0];
      expect(url).toBe(
        `${window.API_BASE_URL}/api/v1/summits/7/presentations/42/submission-period/reopen`
      );
    });
  });

  it("asks getEvent to expand submission_reopened_by", async () => {
    const store = mockStore({
      currentSummitState: { currentSummit: { id: 7 } }
    });

    await store.dispatch(getEvent(42));

    // getEvent's own request is always the first getRequest call; a second,
    // unrelated call (QA users lookup) fires afterward as a side effect.
    expect(capturedParamsHistory[0].expand).toContain("submission_reopened_by");
  });
});
