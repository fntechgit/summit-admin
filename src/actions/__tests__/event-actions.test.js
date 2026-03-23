import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { getEvents } from "../event-actions";
import * as methods from "../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
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

  test("builds speakers_count between filter using [] syntax", async () => {
    const store = mockStore({
      currentSummitState: {
        currentSummit: {
          id: 1,
          time_zone: { name: "UTC" }
        }
      }
    });

    store.dispatch(
      getEvents(null, 1, 10, "id", 1, { speakers_count_filter: [1, 3] }, [])
    );

    await flushPromises();

    expect(getRequest).toHaveBeenCalledTimes(1);
    expect(capturedParams).toBeTruthy();
    expect(capturedParams["filter[]"]).toContain("speakers_count[]1&&3");
    expect(capturedParams["filter[]"]).not.toContain("speakers_count[]]1&&3");
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

  test("builds speakers_count operator filter when value is not an array", async () => {
    const store = mockStore({
      currentSummitState: {
        currentSummit: {
          id: 1,
          time_zone: { name: "UTC" }
        }
      }
    });

    store.dispatch(
      getEvents(null, 1, 10, "id", 1, { speakers_count_filter: ">=2" }, [])
    );

    await flushPromises();

    expect(getRequest).toHaveBeenCalledTimes(1);
    expect(capturedParams).toBeTruthy();
    expect(capturedParams["filter[]"]).toContain("speakers_count>=2");
  });
});
