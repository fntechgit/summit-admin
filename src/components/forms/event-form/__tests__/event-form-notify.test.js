import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import moment from "moment-timezone";
import EventForm from "../index";
import currentSummitMock from "../../../../__mocks__/currentSummitMock";
import showConfirmDialog from "../../../mui/showConfirmDialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/member-input",
  () => ({
    __esModule: true,
    default: ({ id, onChange }) => (
      <button
        type="button"
        data-testid={`memberinput-${id}`}
        onClick={() =>
          onChange({
            target: {
              id,
              type: "text",
              value: {
                id: 99,
                first_name: "Bob",
                last_name: "Newcomer",
                email: "bob@example.com"
              }
            }
          })
        }
      />
    )
  })
);

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
    await userEvent.click(merged);

    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.notify_speakers" })
    );

    await waitFor(() =>
      expect(onNotifySubmissionReopened).toHaveBeenCalledWith(42, {
        speakerIds: [12],
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

  it("keeps the recipient row on the persisted submitter after an unsaved change", async () => {
    renderEventForm({ entity: withPeople });

    await userEvent.click(screen.getByTestId("memberinput-created_by"));

    expect(screen.getByLabelText(/Ada Lovelace/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Bob Newcomer/)).not.toBeInTheDocument();
  });
});
