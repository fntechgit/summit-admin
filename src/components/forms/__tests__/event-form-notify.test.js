import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import moment from "moment-timezone";
import EventForm from "../event-form";
import currentSummitMock from "../../../__mocks__/currentSummitMock";
import showConfirmDialog from "../../mui/showConfirmDialog";
import {
  buildRecipientRows,
  toNotifyPayload,
  ROLE
} from "../../../models/reopen-notification-recipients";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
}));

const speaker = (id, first, last, email) => ({
  id,
  first_name: first,
  last_name: last,
  email
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
    // The merge predicate is the trimmed, lowercased address.
    expect(rows[0].email).toBe("grace@example.com");
  });

  it("tolerates a missing speakers array", () => {
    expect(buildRecipientRows({})).toEqual([]);
    expect(buildRecipientRows(undefined)).toEqual([]);
  });

  it("names both people on a row merged across a shared mailbox", () => {
    const rows = buildRecipientRows({
      created_by: {
        id: 3,
        first_name: "Ada",
        last_name: "Lovelace",
        email: "shared@example.com"
      },
      speakers: [speaker(7, "Grace", "Hopper", "SHARED@example.com")],
      moderator: ""
    });

    expect(rows).toHaveLength(1);
    // Hiding the second identity would be a lie about who the send reaches.
    expect(rows[0].name).toBe("Ada Lovelace, Grace Hopper");
    expect(rows[0].speakerIds).toEqual([7]);
    expect(rows[0].includeSubmitter).toBe(true);
  });

  it("does not repeat a name when the merged identities share one", () => {
    const rows = buildRecipientRows({
      created_by: {
        id: 3,
        first_name: "Ada",
        last_name: "Lovelace",
        email: "shared@example.com"
      },
      speakers: [speaker(7, "Ada", "Lovelace", "shared@example.com")],
      moderator: ""
    });

    expect(rows[0].name).toBe("Ada Lovelace");
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

describe("EventForm reopen notification control", () => {
  const marketplaceHoursType = currentSummitMock.event_types.find(
    (t) => t.id === 935
  );

  const baseProps = {
    history: { push: jest.fn() },
    currentSummit: currentSummitMock,
    levelOpts: [],
    trackOpts: currentSummitMock.tracks,
    typeOpts: currentSummitMock.event_types,
    locationOpts: currentSummitMock.locations,
    // is_enabled + a submission_end_date in the past are what make the reopen block
    // applicable at all: the API only grants a reopen once the window has ended.
    selectionPlansOpts: [
      {
        id: 99,
        is_enabled: true,
        submission_end_date: moment().subtract(7, "days").unix(),
        allowed_presentation_questions: [],
        track_groups: []
      }
    ],
    rsvpTemplateOpts: [],
    actionTypes: [],
    entity: {
      id: 0,
      title: "Test Event",
      type_id: marketplaceHoursType.id,
      track_id: 0,
      location_id: 0,
      start_date: currentSummitMock.start_date + 3600,
      end_date: currentSummitMock.start_date + 7200,
      duration: 3600,
      is_published: false,
      description: "",
      speakers: [],
      moderator: null,
      sponsors: [],
      tags: [],
      extra_questions: [],
      materials: []
    },
    errors: {},
    onSubmit: jest.fn(),
    onSaveIncomplete: jest.fn(),
    onUpdate: jest.fn(),
    onEventUpgrade: jest.fn(),
    onAttach: jest.fn(),
    onUnpublish: jest.fn(),
    onMaterialDelete: jest.fn(),
    onRemoveImage: jest.fn(),
    onAddQAMember: jest.fn(),
    onDeleteQAMember: jest.fn(),
    feedbackState: { term: "", page: 1, comments: [] },
    getEventFeedback: jest.fn(),
    fetchExtraQuestions: jest.fn(),
    fetchExtraQuestionsAnswers: jest.fn(),
    commentState: { filters: {}, comments: [] },
    getEventComments: jest.fn(),
    onCommentDelete: jest.fn(),
    deleteEventFeedback: jest.fn(),
    getEventFeedbackCSV: jest.fn(),
    onFlagChange: jest.fn(),
    onClone: jest.fn()
  };

  const baseEntity = {
    ...baseProps.entity,
    id: 42,
    title: "A TALK",
    class_name: "Presentation",
    type_id: 930,
    track_id: 1,
    selection_plan_id: 99,
    // Note: the incumbent sets submission_reopened_until: "" (no grant); this
    // copy carries a live one so the reopen-notification block renders.
    submission_reopened_until: moment().add(24, "hours").unix(),
    submission_reopened_by_id: 0,
    submission_reopened_by: null
  };

  const withPeople = {
    ...baseEntity,
    created_by: {
      id: 3,
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com"
    },
    speakers: [
      {
        id: 7,
        first_name: "Grace",
        last_name: "Hopper",
        email: "grace@example.com"
      },
      { id: 12, first_name: "Katherine", last_name: "Johnson", email: "" }
    ],
    moderator: ""
  };

  // Panel mounts children only while expanded.
  const renderEventForm = (overrides = {}) => {
    const result = render(<EventForm {...baseProps} {...overrides} />);
    const materialsHeading = screen.queryByText(/^edit_event\.materials/, {
      selector: ".panel-title"
    });
    if (materialsHeading) fireEvent.click(materialsHeading);
    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    showConfirmDialog.mockResolvedValue(true);
  });

  it("does not offer the notify control without a live grant", () => {
    renderEventForm({
      entity: { ...withPeople, submission_reopened_until: "" }
    });
    expect(
      screen.queryByRole("button", { name: "edit_event.notify_speakers" })
    ).not.toBeInTheDocument();
  });

  it("offers the notify control with a live grant", () => {
    renderEventForm({ entity: withPeople });
    expect(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    ).toBeInTheDocument();
  });

  it("checks nothing on mount and opens with the send button disabled", () => {
    renderEventForm({ entity: withPeople });

    screen
      .getAllByRole("checkbox")
      .filter((box) => box.id.startsWith("notify_recipient_"))
      .forEach((box) => expect(box).not.toBeChecked());

    expect(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    ).toBeDisabled();
  });

  it("renders a submitter who is also a speaker as one row", () => {
    renderEventForm({
      entity: {
        ...withPeople,
        speakers: [
          {
            id: 7,
            first_name: "Ada",
            last_name: "Lovelace",
            email: "ada@example.com"
          }
        ]
      }
    });

    // Switched from getAllByText to getAllByLabelText: the entity's created_by also
    // renders as a MemberInput singleValue elsewhere in the form (unrelated to
    // this control), so a plain text query would double-count the same name.
    expect(screen.getAllByLabelText(/Ada Lovelace/)).toHaveLength(1);
  });

  it("renders a row with no email as disabled with the reason inline", () => {
    renderEventForm({ entity: withPeople });

    expect(screen.getByLabelText(/Katherine Johnson/)).toBeDisabled();
    expect(screen.getByText(/edit_event\.notify_no_email/)).toBeInTheDocument();
  });

  it("sends the checked selection after confirmation", async () => {
    const onNotifySubmissionReopened = jest.fn().mockResolvedValue({});
    renderEventForm({ entity: withPeople, onNotifySubmissionReopened });

    await userEvent.click(screen.getByLabelText(/Grace Hopper/));
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    await waitFor(() =>
      expect(onNotifySubmissionReopened).toHaveBeenCalledWith(42, {
        speakerIds: [7],
        includeSubmitter: false
      })
    );
  });

  it("does not send when the admin cancels", async () => {
    const onNotifySubmissionReopened = jest.fn();
    showConfirmDialog.mockResolvedValue(false);
    renderEventForm({ entity: withPeople, onNotifySubmissionReopened });

    await userEvent.click(screen.getByLabelText(/Grace Hopper/));
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    expect(onNotifySubmissionReopened).not.toHaveBeenCalled();
  });

  it("unchecking a merged submitter+speaker row clears BOTH channels", async () => {
    const onNotifySubmissionReopened = jest.fn().mockResolvedValue({});
    renderEventForm({
      entity: {
        ...withPeople,
        speakers: [
          {
            id: 7,
            first_name: "Ada",
            last_name: "Lovelace",
            email: "ada@example.com"
          },
          {
            id: 12,
            first_name: "Grace",
            last_name: "Hopper",
            email: "grace@example.com"
          }
        ]
      },
      onNotifySubmissionReopened
    });

    const merged = screen.getByLabelText(/Ada Lovelace/);
    await userEvent.click(merged);
    await userEvent.click(screen.getByLabelText(/Grace Hopper/));
    await userEvent.click(merged); // uncheck the merged row

    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    // The regression: clearing includeSubmitter but leaving 7 in speakerIds
    // still mails Ada, who the admin just unchecked.
    await waitFor(() =>
      expect(onNotifySubmissionReopened).toHaveBeenCalledWith(42, {
        speakerIds: [12],
        includeSubmitter: false
      })
    );
  });

  it("renders two speakers sharing an email as one row and sends both ids", async () => {
    const onNotifySubmissionReopened = jest.fn().mockResolvedValue({});
    renderEventForm({
      entity: {
        ...withPeople,
        created_by: "",
        speakers: [
          {
            id: 7,
            first_name: "Grace",
            last_name: "Hopper",
            email: "shared@example.com"
          },
          {
            id: 12,
            first_name: "Katherine",
            last_name: "Johnson",
            email: "SHARED@example.com"
          }
        ]
      },
      onNotifySubmissionReopened
    });

    // One row, not two: they share a mailbox. The payload still has to name both,
    // and (per the merged-name fix) so does the row's label: both names resolve
    // to the same single checkbox rather than Katherine's being hidden.
    expect(screen.getByLabelText(/Katherine Johnson/)).toBe(
      screen.getByLabelText(/Grace Hopper/)
    );

    await userEvent.click(screen.getByLabelText(/Grace Hopper/));
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    await waitFor(() =>
      expect(onNotifySubmissionReopened).toHaveBeenCalledWith(42, {
        speakerIds: [7, 12],
        includeSubmitter: false
      })
    );
  });

  it("clears the selection after a successful send", async () => {
    const onNotifySubmissionReopened = jest.fn().mockResolvedValue({});
    renderEventForm({ entity: withPeople, onNotifySubmissionReopened });

    await userEvent.click(screen.getByLabelText(/Grace Hopper/));
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "edit_event.notify_speakers" })
      ).toBeDisabled()
    );
    expect(screen.getByLabelText(/Grace Hopper/)).not.toBeChecked();
  });

  it("disables send when the only checked recipient leaves the talk", async () => {
    // componentDidUpdate refreshes the entity but not the checked keys, so a key
    // can outlive its row. The button must follow what is actually sendable.
    const { rerender } = renderEventForm({ entity: withPeople });

    await userEvent.click(screen.getByLabelText(/Grace Hopper/));
    expect(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    ).toBeEnabled();

    rerender(
      <EventForm {...baseProps} entity={{ ...withPeople, speakers: [] }} />
    );

    expect(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    ).toBeDisabled();
  });

  it("does not send an identity whose row split away while the dialog was open", async () => {
    const onNotifySubmissionReopened = jest.fn().mockResolvedValue({});
    let resolveConfirm;
    showConfirmDialog.mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      })
    );

    const merged = {
      ...withPeople,
      created_by: {
        id: 3,
        first_name: "Ada",
        last_name: "Lovelace",
        email: "shared@example.com"
      },
      speakers: [
        {
          id: 7,
          first_name: "Grace",
          last_name: "Hopper",
          email: "shared@example.com"
        }
      ]
    };

    const { rerender } = renderEventForm({
      entity: merged,
      onNotifySubmissionReopened
    });

    await userEvent.click(screen.getByLabelText(/Ada Lovelace/));
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    // The dialog is open. The entity refreshes and the merged row splits: Grace
    // becomes her own, unticked row.
    rerender(
      <EventForm
        {...baseProps}
        entity={{
          ...merged,
          speakers: [
            {
              id: 7,
              first_name: "Grace",
              last_name: "Hopper",
              email: "grace@example.com"
            }
          ]
        }}
        onNotifySubmissionReopened={onNotifySubmissionReopened}
      />
    );

    resolveConfirm(true);

    await waitFor(() =>
      expect(onNotifySubmissionReopened).toHaveBeenCalledWith(42, {
        speakerIds: [],
        includeSubmitter: true
      })
    );
  });

  it("does not send an identity that merged onto a checked row while the dialog was open", async () => {
    const onNotifySubmissionReopened = jest.fn().mockResolvedValue({});
    let resolveConfirm;
    showConfirmDialog.mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve;
      })
    );

    const separate = {
      ...withPeople,
      created_by: {
        id: 3,
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.com"
      },
      speakers: [
        {
          id: 7,
          first_name: "Grace",
          last_name: "Hopper",
          email: "grace@example.com"
        }
      ]
    };

    const { rerender } = renderEventForm({
      entity: separate,
      onNotifySubmissionReopened
    });

    // Only Ada is ticked. Grace is deliberately left alone.
    await userEvent.click(screen.getByLabelText(/Ada Lovelace/));
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    // While the dialog is open, Grace's record changes to Ada's address, so the
    // two identities now merge onto the row Ada's key points at.
    rerender(
      <EventForm
        {...baseProps}
        entity={{
          ...separate,
          speakers: [
            {
              id: 7,
              first_name: "Grace",
              last_name: "Hopper",
              email: "ada@example.com"
            }
          ]
        }}
        onNotifySubmissionReopened={onNotifySubmissionReopened}
      />
    );

    resolveConfirm(true);

    // Grace was never ticked and the dialog never named her.
    await waitFor(() =>
      expect(onNotifySubmissionReopened).toHaveBeenCalledWith(42, {
        speakerIds: [],
        includeSubmitter: true
      })
    );
  });
});
