import { formatEventData } from "../summitUtils";

describe("summitUtils.formatEventData", () => {
  const summit = {
    time_zone: { name: "UTC" },
    time_zone_id: "UTC"
  };

  test("returns speakers_count based on speakers length when type.use_speakers is true", () => {
    const event = {
      id: 10,
      summit_id: 1,
      title: "Test Event",
      is_published: false,
      type: {
        use_speakers: true,
        allows_location: false,
        allows_attendee_vote: false,
        allows_publishing_dates: false
      },
      speakers: [
        { first_name: "Jane", last_name: "Doe", company: "ACME" },
        { first_name: "John", last_name: "Smith", company: "Globex" }
      ],
      tags: [],
      sponsors: []
    };

    const result = formatEventData(event, summit);

    expect(result.speakers_count).toBe(2);
  });

  test("returns \"0\" when type.use_speakers is true and speakers list is empty", () => {
    const event = {
      id: 12,
      summit_id: 1,
      title: "No Speakers Yet",
      is_published: false,
      type: {
        use_speakers: true,
        allows_location: false,
        allows_attendee_vote: false,
        allows_publishing_dates: false
      },
      speakers: [],
      tags: [],
      sponsors: []
    };

    const result = formatEventData(event, summit);

    expect(result.speakers_count).toBe("0");
  });

  test("returns N/A and does not throw when event type is missing", () => {
    const event = {
      id: 11,
      summit_id: 1,
      title: "Type-less Event",
      is_published: false,
      speakers: [],
      tags: [],
      sponsors: []
    };

    let result;
    expect(() => {
      result = formatEventData(event, summit);
    }).not.toThrow();
    expect(result.speakers_count).toBe("N/A");
  });
});
