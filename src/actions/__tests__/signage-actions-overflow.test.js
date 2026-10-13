import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import {
  getRequest,
  showSuccessMessage
} from "openstack-uicore-foundation/lib/utils/actions";
import * as methods from "../../utils/methods";
import {
  publishToAblyChannel,
  publishToScheduleUpdatesChannel
} from "../ably-actions";
import {
  publishDate,
  publishOverflowEnd,
  publishOverflowState,
  publishReload,
  RELOAD_OVERFLOW_RESYNC_DELAY_MS
} from "../signage-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: jest.fn((key) => key) }
}));

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  showSuccessMessage: jest.fn(() => ({ type: "SUCCESS_MESSAGE" }))
}));

jest.mock("../ably-actions", () => ({
  __esModule: true,
  publishToAblyChannel: jest.fn(),
  publishToScheduleUpdatesChannel: jest.fn()
}));

const mockStore = configureStore([thunk]);

const summitId = 73;
const locationId = 844;
const otherLocationId = 845;
const marketingSiteUrl = "https://2026ocpglobal.fnvirtual.app";
const streamKey =
  "8a529477ec634e35c810f073ade6039a678bb41eae872d22cac2ea8870d38684";
const summit = { id: summitId, marketing_site_url: marketingSiteUrl };
// epoch the sign's clock is at
const fromDate = 1791907200;

const overflowEvent = {
  id: 10140,
  occupancy: "OVERFLOW",
  overflow_stream_key: streamKey
};

// real setImmediate so pending promise chains settle while jest fake timers are active
const { setImmediate: realSetImmediate } = jest.requireActual("timers");
const flushPromises = () =>
  new Promise((resolve) => {
    realSetImmediate(resolve);
  });

const overflowPublishes = () =>
  publishToScheduleUpdatesChannel.mock.calls.filter(
    ([channel]) => channel === `${summitId}:OVERFLOW:*`
  );

describe("signage overflow re-sync", () => {
  let store;
  let requestParams;

  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "https://api.test";
    store = mockStore({
      currentSummitState: { currentSummit: summit },
      signageState: { locationId }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    // thunks, as the real ones
    publishToAblyChannel.mockReturnValue(() => Promise.resolve(true));
    publishToScheduleUpdatesChannel.mockReturnValue(() =>
      Promise.resolve(true)
    );
  });

  const arrangeOverflowEvents = (events) => {
    requestParams = undefined;
    getRequest.mockReturnValue((params) => {
      requestParams = params;
      return () => Promise.resolve({ response: { data: events } });
    });
  };

  const arrangeOverflowRequestFailure = () => {
    getRequest.mockReturnValue(
      () => () =>
        // uicore getRequest rejects with { err, res, ... } (not an Error) after running
        // the error handler, e.g. on a 412
        // eslint-disable-next-line prefer-promise-reject-errors
        Promise.reject({ err: { status: 412 } })
    );
  };

  describe("publishOverflowState", () => {
    it("asks the summit's published events for the location's events in OVERFLOW and re-sends one PresentationOverflow message per event", async () => {
      arrangeOverflowEvents([overflowEvent]);

      const result = await store.dispatch(
        publishOverflowState(summit, locationId, fromDate)
      );

      expect(result).toBe(true);
      expect(getRequest).toHaveBeenCalledTimes(1);
      const [, , url] = getRequest.mock.calls[0];
      expect(url).toBe(
        `https://api.test/api/v1/summits/${summitId}/events/published`
      );

      expect(publishToScheduleUpdatesChannel).toHaveBeenCalledTimes(1);
      const [channel, name, payload] =
        publishToScheduleUpdatesChannel.mock.calls[0];
      expect(channel).toBe(`${summitId}:OVERFLOW:*`);
      expect(name).toBe("EVENT");
      expect(payload).toEqual({
        summit_id: summitId,
        entity_type: "PresentationOverflow",
        entity_id: overflowEvent.id,
        entity_operator: "UPDATE",
        created_at: expect.any(Number),
        params: {
          overflow_url: `${marketingSiteUrl}/a/overflow-player?k=${streamKey}`
        }
      });
    });

    it("filters by location, occupancy and sessions not ended at the sign's time", async () => {
      arrangeOverflowEvents([]);

      await store.dispatch(publishOverflowState(summit, locationId, fromDate));

      expect(requestParams["filter[]"]).toEqual([
        `location_id==${locationId}`,
        "occupancy==OVERFLOW",
        `end_date>=${fromDate}`
      ]);
      expect(requestParams.per_page).toBe(100);
      expect(requestParams.access_token).toBe("TOKEN");
    });

    it("publishes nothing when the summit has no marketing site url to build overflow_url on", async () => {
      arrangeOverflowEvents([overflowEvent]);

      const result = await store.dispatch(
        publishOverflowState(
          { id: summitId, marketing_site_url: null },
          locationId,
          fromDate
        )
      );

      expect(result).toBe(true);
      expect(getRequest).not.toHaveBeenCalled();
      expect(publishToScheduleUpdatesChannel).not.toHaveBeenCalled();
    });

    it("skips events that have no overflow stream key", async () => {
      arrangeOverflowEvents([
        overflowEvent,
        { id: 10139, occupancy: "OVERFLOW", overflow_stream_key: null }
      ]);

      await store.dispatch(publishOverflowState(summit, locationId, fromDate));

      expect(publishToScheduleUpdatesChannel).toHaveBeenCalledTimes(1);
      expect(publishToScheduleUpdatesChannel.mock.calls[0][2].entity_id).toBe(
        10140
      );
    });

    it("publishes nothing when the location has no overflow events", async () => {
      arrangeOverflowEvents([]);

      const result = await store.dispatch(
        publishOverflowState(summit, locationId, fromDate)
      );

      expect(result).toBe(true);
      expect(publishToScheduleUpdatesChannel).not.toHaveBeenCalled();
    });

    it("reports failure instead of rejecting when the events request fails", async () => {
      arrangeOverflowRequestFailure();

      const result = await store.dispatch(
        publishOverflowState(summit, locationId, fromDate)
      );

      expect(result).toBe(false);
      expect(publishToScheduleUpdatesChannel).not.toHaveBeenCalled();
    });

    it("reports failure when a publish fails", async () => {
      arrangeOverflowEvents([overflowEvent]);
      publishToScheduleUpdatesChannel.mockReturnValue(() =>
        Promise.resolve(false)
      );

      const result = await store.dispatch(
        publishOverflowState(summit, locationId, fromDate)
      );

      expect(result).toBe(false);
    });
  });

  describe("publishOverflowEnd", () => {
    let logSpy;
    let errorSpy;

    beforeEach(() => {
      logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it("logs in the console whether the overflow end was published", async () => {
      await store.dispatch(publishOverflowEnd(overflowEvent.id));
      expect(logSpy).toHaveBeenCalledWith(
        `Overflow end for event ${overflowEvent.id} published on ${summitId}:OVERFLOW:*`,
        expect.objectContaining({ params: { overflow_url: "" } })
      );

      publishToScheduleUpdatesChannel.mockResolvedValue(false);
      await store.dispatch(publishOverflowEnd(overflowEvent.id));
      expect(errorSpy).toHaveBeenCalledWith(
        `Overflow end for event ${overflowEvent.id} NOT published on ${summitId}:OVERFLOW:*`,
        expect.objectContaining({ entity_id: overflowEvent.id })
      );
    });

    it("sends the event's PresentationOverflow message with an empty overflow_url straight to Ably, without calling summit-api", async () => {
      await store.dispatch(publishOverflowEnd(overflowEvent.id));

      expect(getRequest).not.toHaveBeenCalled();
      expect(publishToScheduleUpdatesChannel).toHaveBeenCalledTimes(1);
      expect(publishToScheduleUpdatesChannel).toHaveBeenCalledWith(
        `${summitId}:OVERFLOW:*`,
        "EVENT",
        {
          summit_id: summitId,
          entity_type: "PresentationOverflow",
          entity_id: overflowEvent.id,
          entity_operator: "UPDATE",
          created_at: expect.any(Number),
          params: { overflow_url: "" }
        }
      );
      expect(showSuccessMessage).toHaveBeenCalledWith("signage.overflow_ended");
    });

    it("stops loading without showing success when the publish fails", async () => {
      publishToScheduleUpdatesChannel.mockResolvedValue(false);

      await store.dispatch(publishOverflowEnd(overflowEvent.id));

      expect(showSuccessMessage).not.toHaveBeenCalled();
      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });
  });

  describe("publishDate", () => {
    it("sends JUMP_TIME to the sign, then re-sends the overflow state, then shows success", async () => {
      arrangeOverflowEvents([overflowEvent]);

      await store.dispatch(publishDate(fromDate, "signage.date_published"));

      expect(publishToAblyChannel).toHaveBeenCalledTimes(1);
      expect(publishToAblyChannel.mock.calls[0]).toEqual([
        `SIGNAGE:${summitId}:${locationId}`,
        "JUMP_TIME",
        { timestamp: fromDate }
      ]);
      // the signs listen to OVERFLOW on the schedule updates app
      expect(overflowPublishes()).toHaveLength(1);
      // only sessions not ended at the time the sign jumped to
      expect(requestParams["filter[]"]).toContain(`end_date>=${fromDate}`);
      expect(showSuccessMessage).toHaveBeenCalledWith("signage.date_published");
    });

    it("does not reject nor show success over the error when the overflow re-sync fails", async () => {
      arrangeOverflowRequestFailure();

      await expect(
        store.dispatch(publishDate(fromDate, "signage.date_published"))
      ).resolves.toBeUndefined();

      expect(showSuccessMessage).not.toHaveBeenCalled();
      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });

    it("stops loading without re-syncing when JUMP_TIME is not published", async () => {
      publishToAblyChannel.mockReturnValue(() => Promise.resolve(false));

      await store.dispatch(publishDate(fromDate, "signage.date_published"));

      expect(getRequest).not.toHaveBeenCalled();
      expect(showSuccessMessage).not.toHaveBeenCalled();
      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");
    });
  });

  describe("publishReload", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("sends RELOAD now and the overflow state only after the sign had time to reconnect", async () => {
      arrangeOverflowEvents([overflowEvent]);

      await store.dispatch(publishReload());

      expect(publishToAblyChannel).toHaveBeenCalledTimes(1);
      expect(publishToAblyChannel.mock.calls[0]).toEqual([
        `SIGNAGE:${summitId}:${locationId}`,
        "RELOAD",
        {}
      ]);

      jest.advanceTimersByTime(RELOAD_OVERFLOW_RESYNC_DELAY_MS - 1);
      await flushPromises();
      expect(overflowPublishes()).toHaveLength(0);

      jest.advanceTimersByTime(1);
      await flushPromises();
      expect(overflowPublishes()).toHaveLength(1);
      expect(publishToAblyChannel).toHaveBeenCalledTimes(1);
    });

    it("re-syncs the location that was reloaded even if the selection changes during the delay", async () => {
      let state = {
        currentSummitState: { currentSummit: summit },
        signageState: { locationId }
      };
      store = mockStore(() => state);
      arrangeOverflowEvents([overflowEvent]);

      await store.dispatch(publishReload());

      state = {
        ...state,
        signageState: { locationId: otherLocationId }
      };

      jest.advanceTimersByTime(RELOAD_OVERFLOW_RESYNC_DELAY_MS);
      await flushPromises();

      expect(requestParams["filter[]"]).toContain(`location_id==${locationId}`);
    });

    it("re-syncs sessions not ended at the real time the timer fires, since a reload drops the sign's jump offset", async () => {
      const clickedAtMs = 1791900000000;
      jest.setSystemTime(clickedAtMs);
      arrangeOverflowEvents([overflowEvent]);

      await store.dispatch(publishReload());

      jest.advanceTimersByTime(RELOAD_OVERFLOW_RESYNC_DELAY_MS);
      await flushPromises();

      const firedAt = (clickedAtMs + RELOAD_OVERFLOW_RESYNC_DELAY_MS) / 1000;
      expect(requestParams["filter[]"]).toContain(`end_date>=${firedAt}`);
    });

    it("stops loading and schedules no re-sync when RELOAD is not published", async () => {
      publishToAblyChannel.mockReturnValue(() => Promise.resolve(false));

      await store.dispatch(publishReload());

      expect(showSuccessMessage).not.toHaveBeenCalled();
      expect(store.getActions().map((a) => a.type)).toContain("STOP_LOADING");

      jest.advanceTimersByTime(RELOAD_OVERFLOW_RESYNC_DELAY_MS);
      await flushPromises();
      expect(getRequest).not.toHaveBeenCalled();
    });
  });
});
