import React from "react";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import RoomBookingListPage from "../room-booking-list-page";
import roomBookingListReducer from "../../../reducers/room_bookings/room-booking-list-reducer";
import * as methods from "../../../utils/methods";

const mockFetch = jest.fn(() => Promise.resolve());
const mockGridFilterState = { parsedFilter: [], filterValues: [] };

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/grid-filter", () => ({
  __esModule: true,
  ...jest.requireActual(
    "openstack-uicore-foundation/lib/components/mui/grid-filter"
  ),
  GridFilter: () => null,
  useGridFilter: () => mockGridFilterState
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const BASE_STATUS_FILTER = "status==Paid||Reserved||RequestedRefund||Refunded";

const buildStore = (listOverrides = {}) =>
  createStore(
    combineReducers({
      currentSummitState: (
        state = { currentSummit: { id: 1, time_zone_id: "UTC" } }
      ) => state,
      currentRoomBookingListState: roomBookingListReducer
    }),
    {
      currentRoomBookingListState: {
        ...roomBookingListReducer(undefined, {}),
        ...listOverrides
      }
    },
    applyMiddleware(thunk)
  );

const renderPage = (store) => {
  const ui = () => (
    <Provider store={store}>
      <RoomBookingListPage history={{ push: jest.fn() }} />
    </Provider>
  );
  const utils = render(ui());
  return { ...utils, rerenderPage: () => utils.rerender(ui()) };
};

const lastRequestFilter = () => mockFetch.mock.calls.at(-1)[0]["filter[]"];

describe("RoomBookingListPage", () => {
  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(() => (params) => () => mockFetch(params));
    mockGridFilterState.parsedFilter = [];
    mockGridFilterState.filterValues = [];
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockFetch.mockClear();
  });

  test("sends the GridFilter email filter escaped alongside term and base status filter, refetching when it changes", async () => {
    const { rerenderPage } = renderPage(buildStore({ term: "john" }));

    await waitFor(() =>
      expect(lastRequestFilter()).toEqual([
        "owner_name=@john,room_name=@john",
        BASE_STATUS_FILTER
      ])
    );

    mockGridFilterState.filterValues = [
      {
        criteria: "email_filter",
        operator: OPERATORS.LIKE.value,
        value: "jane+test@acme.com"
      }
    ];
    mockGridFilterState.parsedFilter = ["email_filter=@jane+test@acme.com"];
    rerenderPage();

    await waitFor(() =>
      expect(lastRequestFilter()).toEqual([
        "owner_name=@john,room_name=@john",
        "owner_email=@jane%2Btest@acme.com",
        BASE_STATUS_FILTER
      ])
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
