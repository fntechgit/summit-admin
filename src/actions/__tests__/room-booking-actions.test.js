import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import flushPromises from "flush-promises";
import {
  getRequest,
  deleteRequest,
  STOP_LOADING
} from "openstack-uicore-foundation/lib/utils/actions";
import * as methods from "../../utils/methods";
import {
  getRoomBookings,
  refundRoomBooking,
  cancelRoomBooking,
  RECEIVE_ROOM_BOOKINGS
} from "../room-booking-actions";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn(),
  deleteRequest: jest.fn()
}));

const mockStore = configureStore([thunk]);
const MOCK_STATE = { currentSummitState: { currentSummit: { id: 1 } } };

describe("room-booking-actions", () => {
  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getRoomBookings drops a stale RECEIVE_ROOM_BOOKINGS when a newer call supersedes it", async () => {
    let releaseStale;
    let callNum = 0;
    getRequest.mockImplementation(
      (requestAC, receiveAC) => () => (dispatch) => {
        callNum += 1;
        if (callNum === 1) {
          return new Promise((resolve) => {
            releaseStale = () => {
              dispatch(receiveAC({ response: { data: [{ id: "stale" }] } }));
              resolve();
            };
          });
        }
        dispatch(receiveAC({ response: { data: [{ id: "fresh" }] } }));
        return Promise.resolve();
      }
    );

    const store = mockStore(MOCK_STATE);
    const stalePromise = store.dispatch(getRoomBookings("john"));
    await flushPromises();
    await store.dispatch(getRoomBookings("jane"));
    releaseStale();
    await stalePromise;

    const receives = store
      .getActions()
      .filter((a) => a.type === RECEIVE_ROOM_BOOKINGS);
    expect(receives).toHaveLength(1);
    expect(receives[0].payload.response.data).toEqual([{ id: "fresh" }]);
  });

  test("refund and cancel reject on request failure so callers can react, still stopping the loader", async () => {
    // the refund dialog stays open and the list skips its reload only if these reject
    deleteRequest.mockImplementation(
      () => () => () => Promise.reject(new Error("request failed"))
    );

    const store = mockStore(MOCK_STATE);

    await expect(store.dispatch(refundRoomBooking(7, 101, 25))).rejects.toThrow(
      "request failed"
    );
    await expect(store.dispatch(cancelRoomBooking(7, 101))).rejects.toThrow(
      "request failed"
    );
    expect(
      store.getActions().filter((a) => a.type === STOP_LOADING)
    ).toHaveLength(2);
  });
});
