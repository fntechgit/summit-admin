import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventForm from "../event-form";
import currentSummitMock from "../../../__mocks__/currentSummitMock";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("EventForm", () => {
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
    selectionPlansOpts: [],
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
      extra_questions: []
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

  // The calendar popup opens on the summit's start month (October 2025) for
  // both fields, so day 28 (Sep 28, rendered as "rdtOld") is the day right
  // before the summit's start date in both pickers.
  const getDayBeforeSummitStartCell = (container) =>
    container.querySelector("td.rdtOld[data-value=\"28\"]");

  test("does not disable a date before the summit's start date on the Start Date calendar", async () => {
    const user = userEvent.setup();
    const { container } = render(<EventForm {...baseProps} />);

    const startDateInput = screen.getByPlaceholderText(
      "edit_event.placeholders.start_date"
    );
    await user.click(startDateInput);

    const dayBeforeSummitStart = getDayBeforeSummitStartCell(container);
    expect(dayBeforeSummitStart).not.toHaveClass("rdtDisabled");
  });

  test("does not disable a date before the summit's start date on the End Date calendar", async () => {
    const user = userEvent.setup();
    const { container } = render(<EventForm {...baseProps} />);

    const endDateInput = screen.getByPlaceholderText(
      "edit_event.placeholders.end_date"
    );
    await user.click(endDateInput);

    const dayBeforeSummitStart = getDayBeforeSummitStartCell(container);
    expect(dayBeforeSummitStart).not.toHaveClass("rdtDisabled");
  });
});
