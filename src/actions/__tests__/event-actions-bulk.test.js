import { normalizeBulkEvents } from "../event-actions";

describe("event-actions bulk normalization", () => {
  test("does not include speakers in bulk payload", () => {
    const input = [
      {
        id: 10,
        title: "My Event",
        speakers: [{ id: 3 }, { id: 4 }],
        selection_plan: { id: 20 },
        type: { id: 30 },
        track: { id: 40 },
        streaming_url: "https://example.com/live"
      }
    ];

    const result = normalizeBulkEvents(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 10,
      title: "My Event",
      selection_plan_id: 20,
      type_id: 30,
      track_id: 40,
      streaming_url: "https://example.com/live"
    });
    expect(result[0]).not.toHaveProperty("speakers");
  });
});
