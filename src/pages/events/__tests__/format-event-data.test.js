import { formatEventData } from "../summit-event-list-page/helpers";

describe("summit-event-list-page.formatEventData", () => {
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

  test("returns 0 when type.use_speakers is true and speakers list is empty", () => {
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

    expect(result.speakers_count).toBe(0);
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

  test("keeps real event fields raw so the row can be sent back to bulkUpdateEvents unchanged", () => {
    const speakers = [{ id: 1, first_name: "Jane", last_name: "Doe" }];
    const track = { id: 5, name: "Track A" };
    const tags = [{ tag: "ai" }, { tag: "cloud" }];
    const event = {
      id: 13,
      summit_id: 1,
      title: "Raw Fields Event",
      is_published: false,
      type: { use_speakers: true },
      speakers,
      track,
      tags,
      sponsors: [],
      location: { id: 7, name: "Hall A" },
      start_date: 1700000000,
      end_date: 1700003600,
      duration: 3600,
      level: "beginner",
      selection_status: "unaccepted"
    };

    const result = formatEventData(event, summit);

    expect(result.speakers).toBe(speakers);
    expect(result.track).toBe(track);
    expect(result.tags).toBe(tags);
    expect(result.location).toEqual({ id: 7, name: "Hall A" });
    expect(result.start_date).toBe(1700000000);
    expect(result.end_date).toBe(1700003600);
    expect(result.duration).toBe(3600);
    expect(result.level).toBe("beginner");
    expect(result.selection_status).toBe("unaccepted");

    // display-only companions added alongside the raw fields
    expect(result.speaker_names).toBe("Jane Doe");
    expect(result.track_name).toBe("Track A");
    expect(typeof result.start_date_display).toBe("string");
  });
});
