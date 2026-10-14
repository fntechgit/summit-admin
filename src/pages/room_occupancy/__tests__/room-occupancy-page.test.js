import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import RoomOccupancyPage from "../room-occupancy-page";
import { getEventsForOccupancy } from "../../../actions/room-occupancy-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../styles/room-occupancy-page.less", () => ({}), {
  virtual: true
});

jest.mock("../../../actions/room-occupancy-actions", () => ({
  deleteOverflowOccupancy: jest.fn(() => ({ type: "NOOP" })),
  getEventsForOccupancy: jest.fn(() => ({ type: "NOOP" })),
  getEventsForOccupancyCSV: jest.fn(() => ({ type: "NOOP" })),
  saveOccupancy: jest.fn(() => ({ type: "NOOP" })),
  saveOverflowOccupancy: jest.fn(() => ({ type: "NOOP" })),
  subscribeToOccupancyChannel: jest.fn(() => ({ type: "NOOP" }))
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/free-text-search",
  () => ({
    __esModule: true,
    default: () => <div />
  })
);

jest.mock("openstack-uicore-foundation/lib/components/inputs/dropdown", () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ target: { value: 5 } })}>
      pick-room
    </button>
  )
}));

const ROOM_HEADER = "room_occupancy.room";

const buildState = (occupancy = {}) => ({
  currentSummitState: {
    currentSummit: {
      id: 73,
      locations: [{ id: 5, class_name: "SummitVenueRoom", name: "Room A" }]
    }
  },
  currentRoomOccupancyState: {
    term: null,
    roomId: null,
    currentEvents: false,
    order: "start_date",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    events: [
      {
        id: 1,
        title: "Event",
        start_date: "Mon 9:00 am",
        room: "Room A",
        roomId: 5,
        occupancy: "EMPTY",
        speakers: "",
        track: "Track"
      }
    ],
    ...occupancy
  }
});

const renderPage = (occupancy) => {
  renderWithRedux(<RoomOccupancyPage history={{ push: jest.fn() }} />, {
    initialState: buildState(occupancy)
  });
  getEventsForOccupancy.mockClear();
};

describe("RoomOccupancyPage room sorting", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  it("sorts by location asc then desc when no room is selected", async () => {
    renderPage();

    await userEvent.click(screen.getByText(ROOM_HEADER));
    expect(getEventsForOccupancy).toHaveBeenLastCalledWith(
      null,
      null,
      false,
      1,
      10,
      "location",
      1
    );
  });

  it("flips to desc when already sorted by location", async () => {
    renderPage({ order: "location", orderDir: 1 });

    await userEvent.click(screen.getByText(ROOM_HEADER));
    expect(getEventsForOccupancy).toHaveBeenLastCalledWith(
      null,
      null,
      false,
      1,
      10,
      "location",
      -1
    );
  });

  it("does not sort by room when a room is selected", async () => {
    renderPage({ roomId: 5 });

    await userEvent.click(screen.getByText(ROOM_HEADER));
    expect(getEventsForOccupancy).not.toHaveBeenCalled();
  });

  it("keeps the existing key for other sortable columns", async () => {
    renderPage();

    await userEvent.click(screen.getByText("room_occupancy.track"));
    expect(getEventsForOccupancy).toHaveBeenLastCalledWith(
      null,
      null,
      false,
      1,
      10,
      "track",
      1
    );
  });

  it("resets order to start_date when a room is picked while sorted by location", async () => {
    renderPage({ order: "location", orderDir: -1 });

    await userEvent.click(screen.getByText("pick-room"));
    expect(getEventsForOccupancy).toHaveBeenLastCalledWith(
      null,
      5,
      false,
      1,
      10,
      "start_date",
      1
    );
  });

  it("keeps the current order when a room is picked under another sort", async () => {
    renderPage({ order: "track", orderDir: -1 });

    await userEvent.click(screen.getByText("pick-room"));
    expect(getEventsForOccupancy).toHaveBeenLastCalledWith(
      null,
      5,
      false,
      1,
      10,
      "track",
      -1
    );
  });
});
