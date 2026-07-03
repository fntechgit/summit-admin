import { OPERATORS } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import {
  toApiSortKey,
  toUiSortKey,
  getOptionalColumns,
  getCriterias
} from "../helpers";

// ─── sort key aliasing ──────────────────────────────────────────────────────

describe("toApiSortKey / toUiSortKey", () => {
  test("aliases a UI-only column key to its API order-by key", () => {
    expect(toApiSortKey("name")).toBe("last_name");
    expect(toApiSortKey("submitter_company")).toBe("created_by_company");
    expect(toApiSortKey("progress_flags")).toBe("actions");
    expect(toApiSortKey("track_name")).toBe("track");
  });

  test("passes through keys with no alias unchanged", () => {
    expect(toApiSortKey("title")).toBe("title");
  });

  test("aliases an API order-by key back to its UI column key", () => {
    expect(toUiSortKey("last_name")).toBe("name");
    expect(toUiSortKey("created_by_company")).toBe("submitter_company");
    expect(toUiSortKey("actions")).toBe("progress_flags");
    expect(toUiSortKey("track")).toBe("track_name");
  });

  test("passes through keys with no alias unchanged (reverse direction)", () => {
    expect(toUiSortKey("title")).toBe("title");
  });
});

// ─── getOptionalColumns ─────────────────────────────────────────────────────

describe("getOptionalColumns", () => {
  const columns = getOptionalColumns([], [], [], 1);
  const byKey = (key) => columns.find((c) => c.columnKey === key);

  test("includes the expected set of optional columns", () => {
    const keys = columns.map((c) => c.columnKey);
    expect(keys).toEqual(
      expect.arrayContaining([
        "speaker_names",
        "created_by_fullname",
        "duration",
        "track_name",
        "tags",
        "media_uploads"
      ])
    );
  });

  test("duration render shows the formatted value only when the event type allows publishing dates", () => {
    const { render } = byKey("duration");
    expect(render(3600, { type: { allows_publishing_dates: true } })).not.toBe(
      "N/A"
    );
    expect(render(3600, { type: { allows_publishing_dates: false } })).toBe(
      "N/A"
    );
    expect(render(null, { type: { allows_publishing_dates: true } })).toBe(
      "N/A"
    );
  });

  test("tags render joins tag names, or shows N/A when empty", () => {
    const { render } = byKey("tags");
    expect(render([{ tag: "foo" }, { tag: "bar" }])).toBe("foo, bar");
    expect(render([])).toBe("N/A");
    expect(render(null)).toBe("N/A");
  });

  test("location render falls back to N/A when missing", () => {
    const { render } = byKey("location");
    expect(render({ name: "Room A" })).toBe("Room A");
    expect(render(null)).toBe("N/A");
  });
});

// ─── getCriterias ───────────────────────────────────────────────────────────

describe("getCriterias", () => {
  const summit = {
    id: 42,
    selection_plans: [{ id: 1, name: "Plan A" }],
    locations: [{ id: 2, name: "Room A" }],
    tracks: [{ id: 3, name: "Track A" }],
    event_types: [{ id: 4, name: "Talk" }],
    presentation_action_types: [{ id: 5, label: "Action A" }]
  };
  const mediaUploadTypes = [{ id: 6, name: "Slides" }];

  const criterias = getCriterias(summit, mediaUploadTypes);
  const byKey = (key) => criterias.find((c) => c.key === key);

  test("includes the expected set of filter criteria", () => {
    const keys = criterias.map((c) => c.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "event_type_capacity",
        "speaker_id",
        "speaker_company",
        "tags",
        "rsvp_type",
        "progress_flag",
        "duration",
        "submitters",
        "created_by_company",
        "sponsor",
        "all_companies",
        "media_upload_with_type"
      ])
    );
  });

  test("duration customParser converts minutes entered by the user to seconds for the API", () => {
    const { customParser } = byKey("duration");
    expect(customParser({ operator: "==", value: 5 })).toEqual([
      "duration==300"
    ]);
    expect(customParser({ operator: "<", value: 2 })).toEqual(["duration<120"]);
  });

  test("event_type_capacity customParser builds one clause per selected checkbox", () => {
    const { customParser } = byKey("event_type_capacity");
    expect(customParser({ value: ["allows_location_filter"] })).toEqual([
      "type_allows_location==1"
    ]);
    expect(
      customParser({
        value: [
          "allows_attendee_vote_filter",
          "allows_location_filter",
          "allows_publishing_dates_filter"
        ]
      })
    ).toEqual([
      "type_allows_attendee_vote==1",
      "type_allows_location==1",
      "type_allows_publishing_dates==1"
    ]);
    expect(customParser({ value: [] })).toEqual([]);
  });

  test("speaker_id customParser extracts option values and joins with ||", () => {
    const { customParser } = byKey("speaker_id");
    expect(customParser({ value: [{ value: 1 }, { value: 2 }] })).toEqual([
      "speaker_id==1||2"
    ]);
  });

  test("speaker_company customParser escapes and joins raw company names", () => {
    const { customParser } = byKey("speaker_company");
    expect(
      customParser({
        value: [{ raw: { name: "Acme" } }, { raw: { name: "Globex" } }]
      })
    ).toEqual(["speaker_company==Acme||Globex"]);
  });

  test("tags customParser escapes and joins option labels", () => {
    const { customParser } = byKey("tags");
    expect(
      customParser({ value: [{ label: "foo" }, { label: "bar" }] })
    ).toEqual(["tags==foo||bar"]);
  });

  test("rsvp_type customParser flips operator based on truthiness of value", () => {
    const { customParser } = byKey("rsvp_type");
    expect(customParser({ value: true })).toEqual(["rsvp_type<>None"]);
    expect(customParser({ value: false })).toEqual(["rsvp_type==None"]);
  });

  test("progress_flag customParser builds a compound actions filter per selected flag", () => {
    const { customParser } = byKey("progress_flag");
    expect(customParser({ value: [10, 20] })).toEqual([
      "actions==type_id==10&&is_completed==1,actions==type_id==20&&is_completed==1"
    ]);
  });

  test("submitters customParser builds a fullname+email filter pair per selected submitter", () => {
    const { customParser } = byKey("submitters");
    expect(
      customParser({
        value: [
          { raw: { first_name: "Jane", last_name: "Doe", email: "jane@x.com" } }
        ]
      })
    ).toEqual(["created_by_fullname==Jane Doe,created_by_email==jane@x.com"]);
  });

  test("created_by_company customParser escapes and joins raw company names", () => {
    const { customParser } = byKey("created_by_company");
    expect(customParser({ value: [{ raw: { name: "Acme" } }] })).toEqual([
      "created_by_company==Acme"
    ]);
  });

  test("sponsor customParser escapes and joins raw company names", () => {
    const { customParser } = byKey("sponsor");
    expect(customParser({ value: [{ raw: { name: "Acme" } }] })).toEqual([
      "sponsor==Acme"
    ]);
  });

  test("all_companies customParser applies the same company list across speaker/submitter/sponsor filters", () => {
    const { customParser } = byKey("all_companies");
    expect(customParser({ value: [{ raw: { name: "Acme" } }] })).toEqual([
      "speaker_company==Acme,created_by_company==Acme,sponsor==Acme"
    ]);
  });

  test("media_upload_with_type customParser branches on HAS vs HAS_NOT with different join separators", () => {
    const { customParser } = byKey("media_upload_with_type");
    expect(
      customParser({ operator: OPERATORS.HAS.value, value: [1, 2] })
    ).toEqual(["has_media_upload_with_type==1||2"]);
    expect(
      customParser({ operator: OPERATORS.HAS_NOT.value, value: [1, 2] })
    ).toEqual(["has_not_media_upload_with_type==1&&2"]);
  });
});
