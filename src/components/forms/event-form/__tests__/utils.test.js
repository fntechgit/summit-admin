import { buildRecipientRows, toNotifyPayload, ROLE } from "../utils";

const speaker = (id, first, last, email) => ({
  id,
  first_name: first,
  last_name: last,
  email
});

describe("buildRecipientRows", () => {
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

  it("merges the moderator by id even when the two records disagree on email", () => {
    const rows = buildRecipientRows({
      created_by: "",
      speakers: [speaker(9, "Alan", "Turing", "alan@example.com")],
      moderator: speaker(9, "Alan", "Turing", "alan.turing@example.com")
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe("speaker:9");
    expect(rows[0].speakerIds).toEqual([9]);
    expect(rows[0].roles).toEqual([ROLE.SPEAKER, ROLE.MODERATOR]);
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

  it("names both people on a row merged across a shared mailbox", () => {
    const rows = buildRecipientRows({
      created_by: speaker(3, "Ada", "Lovelace", "shared@example.com"),
      speakers: [speaker(7, "Grace", "Hopper", "SHARED@example.com")],
      moderator: ""
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Ada Lovelace, Grace Hopper");
    expect(rows[0].speakerIds).toEqual([7]);
    expect(rows[0].includeSubmitter).toBe(true);
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

  it("unions the channels of every checked row", () => {
    expect(toNotifyPayload(rows, ["submitter", "speaker:12"])).toEqual({
      speakerIds: [7, 12],
      includeSubmitter: true
    });
  });

  it("excludes a row that went disabled while its key was still checked", () => {
    expect(toNotifyPayload(rows, ["speaker:20"])).toEqual({
      speakerIds: [],
      includeSubmitter: false
    });
  });
});
