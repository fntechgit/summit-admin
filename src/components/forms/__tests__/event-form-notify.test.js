import {
  normalizeEmail,
  buildRecipientRows,
  toNotifyPayload,
  ROLE
} from "../../../models/reopen-notification-recipients";

const speaker = (id, first, last, email) => ({
  id,
  first_name: first,
  last_name: last,
  email
});

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("returns an empty string for a non-string", () => {
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(42)).toBe("");
  });
});

describe("buildRecipientRows", () => {
  it("returns no rows for an entity with no people", () => {
    // normalizeEventResponse coerces server nulls to "", which is why these are
    // empty strings rather than null.
    expect(
      buildRecipientRows({ created_by: "", speakers: [], moderator: "" })
    ).toEqual([]);
  });

  it("builds a submitter row carrying includeSubmitter and no speaker id", () => {
    const rows = buildRecipientRows({
      created_by: speaker(3, "Ada", "Lovelace", "ada@example.com"),
      speakers: [],
      moderator: ""
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: "submitter",
      name: "Ada Lovelace",
      roles: [ROLE.SUBMITTER],
      speakerIds: [],
      includeSubmitter: true,
      email: "ada@example.com",
      disabled: false
    });
  });

  it("builds one row per speaker, keyed by speaker id", () => {
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [
        speaker(7, "Grace", "Hopper", "grace@example.com"),
        speaker(12, "Katherine", "Johnson", "katherine@example.com")
      ],
      moderator: ""
    });

    expect(rows.map((r) => r.key)).toEqual(["speaker:7", "speaker:12"]);
    expect(rows[0].speakerIds).toEqual([7]);
    expect(rows[0].includeSubmitter).toBe(false);
  });

  it("merges a moderator who is also a speaker into one row with both roles", () => {
    const alan = speaker(9, "Alan", "Turing", "alan@example.com");
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [alan],
      moderator: alan
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("speaker:9");
    expect(rows[0].roles).toEqual([ROLE.SPEAKER, ROLE.MODERATOR]);
    expect(rows[0].speakerIds).toEqual([9]);
  });

  it("merges the moderator by id even when the two records disagree on email", () => {
    // Identity dedupe runs before the email merge precisely so a stale email on
    // one of the two records cannot split one person into two rows.
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [speaker(9, "Alan", "Turing", "alan@example.com")],
      moderator: speaker(9, "Alan", "Turing", "alan.turing@example.com")
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].speakerIds).toEqual([9]);
    expect(rows[0].roles).toEqual([ROLE.SPEAKER, ROLE.MODERATOR]);
  });

  it("merges the moderator into the speaker row when the ids differ only by type", () => {
    // A Map keys strictly but the row key string-coerces, so 7 and "7" would
    // otherwise become two rows sharing the key "speaker:7".
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [speaker(7, "Grace", "Hopper", "grace@example.com")],
      moderator: speaker("7", "Grace", "Hopper", "grace.new@example.com")
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("speaker:7");
    expect(rows[0].roles).toEqual([ROLE.SPEAKER, ROLE.MODERATOR]);
    expect(rows[0].speakerIds).toEqual([7]);
  });

  it("adds a moderator who is not in the speakers array as its own row", () => {
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [speaker(7, "Grace", "Hopper", "grace@example.com")],
      moderator: speaker(9, "Alan", "Turing", "alan@example.com")
    });

    expect(rows.map((r) => r.key)).toEqual(["speaker:7", "speaker:9"]);
    expect(rows[1].roles).toEqual([ROLE.MODERATOR]);
  });

  it("merges a submitter who is also a speaker into one row spanning both channels", () => {
    const rows = buildRecipientRows({
      created_by: speaker(3, "Ada", "Lovelace", "Ada@Example.com"),
      speakers: [speaker(7, "Ada", "Lovelace", "ada@example.com")],
      moderator: ""
    });

    expect(rows).toHaveLength(1);
    // The submitter is built first, so it keeps the key. Key stability across
    // renders is what lets the checked set be a list of keys.
    expect(rows[0].key).toBe("submitter");
    expect(rows[0].roles).toEqual([ROLE.SUBMITTER, ROLE.SPEAKER]);
    expect(rows[0].speakerIds).toEqual([7]);
    expect(rows[0].includeSubmitter).toBe(true);
  });

  it("merges two distinct speakers whose emails differ only by case", () => {
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [
        speaker(7, "Grace", "Hopper", "shared@example.com"),
        speaker(12, "Katherine", "Johnson", "SHARED@example.com")
      ],
      moderator: ""
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("speaker:7");
    expect(rows[0].speakerIds).toEqual([7, 12]);
  });

  it("marks a row with no email disabled and never merges on the empty email", () => {
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [
        speaker(7, "Grace", "Hopper", ""),
        speaker(12, "Katherine", "Johnson", "")
      ],
      moderator: ""
    });

    expect(rows).toHaveLength(2);
    expect(rows[0].disabled).toBe(true);
    expect(rows[1].disabled).toBe(true);
  });

  it("falls back to the email when both name fields are blank", () => {
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [speaker(7, "", "", "  Grace@Example.com ")],
      moderator: ""
    });

    expect(rows[0].name).toBe("Grace@Example.com");
  });

  it("tolerates a missing speakers array", () => {
    expect(buildRecipientRows({})).toEqual([]);
    expect(buildRecipientRows(undefined)).toEqual([]);
  });
});

describe("toNotifyPayload", () => {
  const rows = [
    {
      key: "submitter",
      speakerIds: [7],
      includeSubmitter: true,
      disabled: false
    },
    {
      key: "speaker:12",
      speakerIds: [12],
      includeSubmitter: false,
      disabled: false
    },
    {
      key: "speaker:20",
      speakerIds: [20],
      includeSubmitter: false,
      disabled: true
    }
  ];

  it("is empty when nothing is checked", () => {
    expect(toNotifyPayload(rows, [])).toEqual({
      speakerIds: [],
      includeSubmitter: false
    });
  });

  it("unions the channels of every checked row", () => {
    expect(toNotifyPayload(rows, ["submitter", "speaker:12"])).toEqual({
      speakerIds: [7, 12],
      includeSubmitter: true
    });
  });

  it("drops both channels of a merged row when it is unchecked", () => {
    // The regression this guards: clearing includeSubmitter but leaving speaker 7
    // in the payload still mails a person the admin unchecked.
    expect(toNotifyPayload(rows, ["speaker:12"])).toEqual({
      speakerIds: [12],
      includeSubmitter: false
    });
  });

  it("excludes a disabled row even if its key is somehow checked", () => {
    expect(toNotifyPayload(rows, ["speaker:20"])).toEqual({
      speakerIds: [],
      includeSubmitter: false
    });
  });

  it("de-duplicates speaker ids across checked rows", () => {
    const overlapping = [
      { key: "a", speakerIds: [7], includeSubmitter: false, disabled: false },
      { key: "b", speakerIds: [7, 9], includeSubmitter: false, disabled: false }
    ];
    expect(toNotifyPayload(overlapping, ["a", "b"]).speakerIds).toEqual([7, 9]);
  });
});
