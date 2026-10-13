import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import * as methods from "../../utils/methods";
import { publishToAblyChannel } from "../ably-actions";
import {
  publishDate,
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
  getRequest: jest.fn()
}));

jest.mock("../ably-actions", () => ({
  __esModule: true,
  publishToAblyChannel: jest.fn()
}));

const mockStore = configureStore([thunk]);

const summitId = 73;
const locationId = 844;
const marketingSiteUrl = "https://2026ocpglobal.fnvirtual.app";
const streamKey =
  "8a529477ec634e35c810f073ade6039a678bb41eae872d22cac2ea8870d38684";

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

describe("signage overflow re-sync", () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    window.API_BASE_URL = "https://api.test";
    store = mockStore({
      currentSummitState: {
        currentSummit: { id: summitId, marketing_site_url: marketingSiteUrl }
      },
      signageState: { locationId }
    });
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    publishToAblyChannel.mockResolvedValue(true);
  });

  let requestParams;

  const arrangeOverflowEvents = (events) => {
    requestParams = undefined;
    getRequest.mockReturnValue((params) => {
      requestParams = params;
      return () => Promise.resolve({ response: { data: events } });
    });
  };

  describe("publishOverflowState", () => {
    it("asks the API for the location's events in OVERFLOW and re-sends one PresentationOverflow message per event", async () => {
      arrangeOverflowEvents([overflowEvent]);

      await store.dispatch(publishOverflowState());

      expect(getRequest).toHaveBeenCalledTimes(1);
      const [, , url] = getRequest.mock.calls[0];
      expect(url).toBe(
        `https://api.test/api/v1/summits/${summitId}/locations/${locationId}/events/published`
      );

      expect(publishToAblyChannel).toHaveBeenCalledTimes(1);
      const [channel, name, payload] = publishToAblyChannel.mock.calls[0];
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

    it("filters the request by occupancy so only overflow events come back", async () => {
      arrangeOverflowEvents([]);

      await store.dispatch(publishOverflowState());

      expect(requestParams["filter[]"]).toEqual(["occupancy==OVERFLOW"]);
      expect(requestParams.per_page).toBe(100);
      expect(requestParams.access_token).toBe("TOKEN");
    });

    it("publishes nothing when the summit has no marketing site url to build overflow_url on", async () => {
      store = mockStore({
        currentSummitState: {
          currentSummit: { id: summitId, marketing_site_url: null }
        },
        signageState: { locationId }
      });
      arrangeOverflowEvents([overflowEvent]);

      await store.dispatch(publishOverflowState());

      expect(getRequest).not.toHaveBeenCalled();
      expect(publishToAblyChannel).not.toHaveBeenCalled();
    });

    it("skips events that have no overflow stream key", async () => {
      arrangeOverflowEvents([
        overflowEvent,
        { id: 10139, occupancy: "OVERFLOW", overflow_stream_key: null }
      ]);

      await store.dispatch(publishOverflowState());

      expect(publishToAblyChannel).toHaveBeenCalledTimes(1);
      expect(publishToAblyChannel.mock.calls[0][2].entity_id).toBe(10140);
    });

    it("publishes nothing when the location has no overflow events", async () => {
      arrangeOverflowEvents([]);

      await store.dispatch(publishOverflowState());

      expect(publishToAblyChannel).not.toHaveBeenCalled();
    });
  });

  describe("publishDate", () => {
    it("sends JUMP_TIME to the sign and then re-sends the overflow state", async () => {
      arrangeOverflowEvents([overflowEvent]);

      await store.dispatch(publishDate(1791907200, "signage.date_published"));

      expect(publishToAblyChannel).toHaveBeenCalledTimes(2);
      expect(publishToAblyChannel.mock.calls[0]).toEqual([
        `SIGNAGE:${summitId}:${locationId}`,
        "JUMP_TIME",
        { timestamp: 1791907200 }
      ]);
      expect(publishToAblyChannel.mock.calls[1][0]).toBe(
        `${summitId}:OVERFLOW:*`
      );
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
      expect(publishToAblyChannel).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1);
      await flushPromises();
      expect(publishToAblyChannel).toHaveBeenCalledTimes(2);
      expect(publishToAblyChannel.mock.calls[1][0]).toBe(
        `${summitId}:OVERFLOW:*`
      );
    });
  });
});
