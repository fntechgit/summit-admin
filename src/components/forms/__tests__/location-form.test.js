import React from "react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import LocationForm from "../location-form";
import currentSummitMock from "../../../__mocks__/currentSummitMock";

describe("LocationForm", () => {
  beforeEach(() => {
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

    render(<LocationForm {...props} />);
  });

  describe("IsMain? checkbox", () => {
    test("should render info icon", async () => {
      const checkbox = screen.getByTitle("edit_location.is_main_info");
      expect(checkbox).toBeInTheDocument();
    });
  });
});
