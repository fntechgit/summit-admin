import React from "react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import LocationForm from "../location-form";
import currentSummitMock from "../../../__mocks__/currentSummitMock";

const buildProps = (overrides = {}) => {
  const props = {
    history: {
      length: 8,
      action: "POP",
      location: {
        pathname: "/app/summits/69/locations/781",
        search: "",
        hash: "",
        key: "wh0sst"
      }
    },
    currentSummit: currentSummitMock,
    allClasses: [
      {
        name: "string",
        short_name: "string",
        description: "string",
        type: ["External", "Internal"],
        banners: "array",
        order: "integer",
        opening_hour: "integer",
        closing_hour: "integer",
        address_1: "string",
        address_2: "string",
        zip_code: "string",
        city: "string",
        state: "string",
        country: "string",
        website_url: "string",
        lng: "string",
        lat: "string",
        display_on_site: "boolean",
        details_page: "boolean",
        location_message: "string",
        images: "array",
        class_name: "SummitVenue",
        is_main: "boolean",
        floors: "array",
        rooms: "array"
      },
      {
        name: "string",
        short_name: "string",
        description: "string",
        type: ["External", "Internal"],
        banners: "array",
        order: "integer",
        opening_hour: "integer",
        closing_hour: "integer",
        address_1: "string",
        address_2: "string",
        zip_code: "string",
        city: "string",
        state: "string",
        country: "string",
        website_url: "string",
        lng: "string",
        lat: "string",
        display_on_site: "boolean",
        details_page: "boolean",
        location_message: "string",
        images: "array",
        class_name: "SummitAirport",
        capacity: "integer",
        airport_type: ["International", "Domestic"]
      }
    ],
    entity: {
      id: 781,
      name: "International Barcelona Convention Center",
      short_name: "CCIB",
      class_name: "SummitVenue",
      description: "",
      location_type: "Internal",
      address_1: "Plaça de Willy Brandt, 11-14",
      address_2: "",
      zip_code: "08019",
      city: "Sant Marti",
      state: "Barcelona",
      country: "ES",
      website_url: "",
      lng: "2.2193",
      lat: "41.4088",
      display_on_site: false,
      details_page: false,
      is_main: false,
      location_message: "",
      maps: [],
      images: [],
      rooms: [],
      floors: [],
      capacity: 0,
      booking_link: "",
      sold_out: false,
      airport_type: "",
      hotel_type: "",
      created: 1762190581,
      last_edited: 1762190581,
      order: 48,
      opening_hour: "",
      closing_hour: ""
    },
    errors: {},
    onSubmit: jest.fn(),
    onMapUpdate: jest.fn(),
    onMarkerDragged: jest.fn(),
    onFloorDelete: jest.fn(),
    onRoomDelete: jest.fn(),
    onImageDelete: jest.fn(),
    onMapDelete: jest.fn()
  };

  return { ...props, ...overrides };
};

describe("LocationForm", () => {
  beforeEach(() => {
    render(<LocationForm {...buildProps()} />);
  });

  describe("IsMain? checkbox", () => {
    test("should render info icon", async () => {
      const checkbox = screen.getByTitle("edit_location.is_main_info");
      expect(checkbox).toBeInTheDocument();
    });
  });
});

describe("LocationForm Resync Room action", () => {
  // The materializer's per-room resync route takes integer venue/room ids.
  // This form is handed the room id already; it previously looked the room's
  // NAME back up and sent that, which cannot resolve against the route.
  const VENUE_ID = 781;
  const ROOM_ID = 5002;

  test("passes the venue id and room id, not their names", async () => {
    const onRoomResync = jest.fn();
    const props = buildProps({ syncEnabled: true, onRoomResync });
    props.entity = {
      ...props.entity,
      id: VENUE_ID,
      rooms: [{ id: ROOM_ID, name: "Room A", capacity: 10, floor_name: "" }]
    };

    const { container } = render(<LocationForm {...props} />);

    // The Rooms panel is collapsed by default; open it the way a user would.
    await userEvent.click(screen.getByText("edit_location.rooms"));

    // uicore's Table renders custom row actions as <a data-tip={tooltip}>.
    const resyncButton = container.querySelector(
      "[data-tip='dropbox_sync.resync_tooltip']"
    );
    expect(resyncButton).toBeInTheDocument();
    await userEvent.click(resyncButton);

    expect(onRoomResync).toHaveBeenCalledWith(VENUE_ID, ROOM_ID);
  });
});
