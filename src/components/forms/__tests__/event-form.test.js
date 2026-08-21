import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import moment from "moment-timezone";
import EventForm from "../event-form";
import currentSummitMock from "../../../__mocks__/currentSummitMock";
import showConfirmDialog from "../../mui/showConfirmDialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
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
      // The Materials panel is expanded by renderEventForm, so uicore's Table now
      // actually mounts and maps over this.
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

  // The reopen section lives inside the Materials panel, and uicore's Panel mounts
  // its children only while expanded, so every assertion here needs it open first.
  // queryByText, not getByText: the panel itself is gated on a saved presentation,
  // and the tests that assert the control is absent pass entities that suppress it.
  const renderEventForm = (overrides = {}) => {
    const result = render(<EventForm {...baseProps} {...overrides} />);
    const materialsHeading = screen.queryByText(/^edit_event\.materials/, {
      selector: ".panel-title"
    });
    if (materialsHeading) fireEvent.click(materialsHeading);
    return result;
  };

  // Built on baseProps.entity (not the bare object from the task brief) because
  // several unrelated, pre-existing render paths (TagInput, isEventType,
  // isQuestionAllowed, the track-scoped selection_plans_ddl filter) dereference
  // entity.tags / typeOpts / selectionPlansOpts lookups without a null guard.
  // selection_plan_id (99) matches the single entry in
  // baseProps.selectionPlansOpts (including its empty track_groups, so the
  // track_id-based ddl filter doesn't crash) so isQuestionAllowed() doesn't
  // crash either, and truthy selection_plan_id is required for the reopen
  // block to render at all now that it gates on it. type_id 930 is
  // "Presentation" in currentSummitMock. class_name is required for
  // isPresentation() to be true. None of this is asserted by the tests below.
  const baseEntity = {
    ...baseProps.entity,
    id: 42,
    title: "A TALK",
    class_name: "Presentation",
    type_id: 930,
    track_id: 1,
    selection_plan_id: 99,
    submission_reopened_until: "",
    submission_reopened_by_id: 0,
    submission_reopened_by: null
  };

  it("offers the reopen control on a presentation with no active grant", () => {
    renderEventForm({ entity: baseEntity });

    expect(
      screen.getByRole("button", { name: "edit_event.reopen_submission" })
    ).toBeInTheDocument();
  });

  it("leaves the Materials panel title plain when there is no grant", () => {
    renderEventForm({ entity: baseEntity });

    expect(
      screen.getByText("edit_event.materials", { selector: ".panel-title" })
    ).toBeInTheDocument();
  });

  it("does not offer the reopen control on a new presentation", () => {
    renderEventForm({ entity: { ...baseEntity, id: 0 } });

    expect(
      screen.queryByRole("button", { name: "edit_event.reopen_submission" })
    ).not.toBeInTheDocument();
  });

  it("does not offer the reopen control on a presentation with no selection plan", () => {
    renderEventForm({ entity: { ...baseEntity, selection_plan_id: null } });

    expect(
      screen.queryByRole("button", { name: "edit_event.reopen_submission" })
    ).not.toBeInTheDocument();
  });

  // The API only reopens a window that has actually ended on an enabled plan. Keying
  // the UI on the grant alone would offer a button the server can only 412, and would
  // announce a deadline that is no longer the operative one.
  const planWith = (over) => ({
    ...baseProps.selectionPlansOpts[0],
    ...over
  });

  it("does not offer the reopen control while the plan's window is still open", () => {
    renderEventForm({
      entity: baseEntity,
      selectionPlansOpts: [
        planWith({ submission_end_date: moment().add(7, "days").unix() })
      ]
    });

    expect(
      screen.queryByRole("button", { name: "edit_event.reopen_submission" })
    ).not.toBeInTheDocument();
  });

  it("does not offer the reopen control on a disabled plan", () => {
    renderEventForm({
      entity: baseEntity,
      selectionPlansOpts: [planWith({ is_enabled: false })]
    });

    expect(
      screen.queryByRole("button", { name: "edit_event.reopen_submission" })
    ).not.toBeInTheDocument();
  });

  // The ops case smarcet raised on the call-for-presentations PR: a grant is issued,
  // then the plan's submission_end_date is extended past it. The speaker now edits
  // under normal open-window rules, so the grant's deadline is not what constrains
  // them and must not be presented as if it were.
  it("does not announce a grant once the plan window has been extended past it", () => {
    renderEventForm({
      entity: {
        ...baseEntity,
        submission_reopened_until: moment().add(24, "hours").unix()
      },
      selectionPlansOpts: [
        planWith({ submission_end_date: moment().add(7, "days").unix() })
      ]
    });

    expect(
      screen.queryByText(/edit_event.reopened_until/)
    ).not.toBeInTheDocument();
    // The panel title shares the section's gate for exactly this case: keyed on the
    // grant alone it would announce a deadline the server no longer honours.
    expect(
      screen.getByText("edit_event.materials", { selector: ".panel-title" })
    ).toBeInTheDocument();
  });

  it("disables the reopen button when no valid hours value is selected", async () => {
    renderEventForm({ entity: baseEntity });

    await userEvent.selectOptions(
      screen.getByLabelText("edit_event.reopen_duration"),
      "custom"
    );

    expect(
      screen.getByRole("button", { name: "edit_event.reopen_submission" })
    ).toBeDisabled();
  });

  // "1.5" and "1e3" are the ones that matter: parseInt reads both as 1, so without a
  // positive-integer check the admin silently gets a one hour window instead of what
  // they typed, and "1e3" never reaches the server's 412 for 1000 hours.
  // Set the value rather than typing it: jsdom normalises a typed "1e3" to "1000",
  // while a real browser keeps "1e3" in a number input.
  // "9999999999" is ten digits and a plain integer but overflows moment, which threw in the
  // confirm dialog before the admin saw it. Only reachable with no ceiling configured.
  it.each([["-1"], ["0"], ["1.5"], ["1e3"], ["abc"], ["9999999999"]])(
    "keeps the reopen button disabled for the custom hours value %s",
    async (value) => {
      renderEventForm({ entity: baseEntity });

      await userEvent.selectOptions(
        screen.getByLabelText("edit_event.reopen_duration"),
        "custom"
      );
      fireEvent.change(
        screen.getByLabelText("edit_event.reopen_custom_hours"),
        { target: { value } }
      );

      expect(
        screen.getByRole("button", { name: "edit_event.reopen_submission" })
      ).toBeDisabled();
    }
  );

  // CFP_MAX_REOPEN_HOURS mirrors the server's ceiling so an over-limit value is
  // caught before the confirm dialog instead of by the 412 after it.
  describe("with a configured reopen ceiling", () => {
    beforeEach(() => {
      window.CFP_MAX_REOPEN_HOURS = "48";
    });

    afterEach(() => {
      delete window.CFP_MAX_REOPEN_HOURS;
    });

    it("keeps the reopen button disabled for a custom value above the ceiling", async () => {
      renderEventForm({ entity: baseEntity });

      await userEvent.selectOptions(
        screen.getByLabelText("edit_event.reopen_duration"),
        "custom"
      );
      fireEvent.change(
        screen.getByLabelText("edit_event.reopen_custom_hours_capped"),
        { target: { value: "49" } }
      );

      expect(
        screen.getByRole("button", { name: "edit_event.reopen_submission" })
      ).toBeDisabled();
    });

    it("still accepts a custom value on the ceiling", async () => {
      const onReopenSubmission = jest.fn().mockResolvedValue({});
      showConfirmDialog.mockResolvedValue(true);
      renderEventForm({ entity: baseEntity, onReopenSubmission });

      await userEvent.selectOptions(
        screen.getByLabelText("edit_event.reopen_duration"),
        "custom"
      );
      fireEvent.change(
        screen.getByLabelText("edit_event.reopen_custom_hours_capped"),
        { target: { value: "48" } }
      );
      await userEvent.click(
        screen.getByRole("button", { name: "edit_event.reopen_submission" })
      );

      await waitFor(() =>
        expect(onReopenSubmission).toHaveBeenCalledWith(42, 48)
      );
    });

    // The ceiling applies to the presets too, so a deployment that sets it below
    // 72 can't offer a preset the server would refuse.
    it("keeps the reopen button disabled for a preset above the ceiling", async () => {
      renderEventForm({ entity: baseEntity });

      await userEvent.selectOptions(
        screen.getByLabelText("edit_event.reopen_duration"),
        "72"
      );

      expect(
        screen.getByRole("button", { name: "edit_event.reopen_submission" })
      ).toBeDisabled();
    });
  });

  // Unset means uncapped: the server's 412 stays the only ceiling, so a deployment
  // that never sets CFP_MAX_REOPEN_HOURS behaves exactly as it did before.
  it("leaves the custom hours uncapped when CFP_MAX_REOPEN_HOURS is unset", async () => {
    const onReopenSubmission = jest.fn().mockResolvedValue({});
    showConfirmDialog.mockResolvedValue(true);
    renderEventForm({ entity: baseEntity, onReopenSubmission });

    await userEvent.selectOptions(
      screen.getByLabelText("edit_event.reopen_duration"),
      "custom"
    );
    fireEvent.change(screen.getByLabelText("edit_event.reopen_custom_hours"), {
      target: { value: "5000" }
    });
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.reopen_submission" })
    );

    await waitFor(() =>
      expect(onReopenSubmission).toHaveBeenCalledWith(42, 5000)
    );
  });

  it("sends the selected preset hours to onReopenSubmission after confirmation", async () => {
    const onReopenSubmission = jest.fn().mockResolvedValue({});
    showConfirmDialog.mockResolvedValue(true);
    renderEventForm({ entity: baseEntity, onReopenSubmission });

    await userEvent.selectOptions(
      screen.getByLabelText("edit_event.reopen_duration"),
      "48"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.reopen_submission" })
    );

    await waitFor(() =>
      expect(onReopenSubmission).toHaveBeenCalledWith(42, 48)
    );
  });

  it("does not call onReopenSubmission when the admin cancels", async () => {
    const onReopenSubmission = jest.fn();
    showConfirmDialog.mockResolvedValue(false);
    renderEventForm({ entity: baseEntity, onReopenSubmission });

    await userEvent.click(
      screen.getByRole("button", { name: "edit_event.reopen_submission" })
    );

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
    expect(onReopenSubmission).not.toHaveBeenCalled();
  });

  describe("with an active reopen grant", () => {
    const grantedEntity = {
      ...baseEntity,
      submission_reopened_until: moment().add(24, "hours").unix(),
      // submission_reopened_by_id is deliberately absent: One2ManyExpandSerializer
      // unsets it when it writes the expanded object.
      submission_reopened_by: {
        id: 5,
        first_name: "Ada",
        last_name: "Lovelace",
        email: "ada@example.org"
      }
    };

    // The grant exists but the payload was not expanded, or the caller lacked the
    // expand. The reopened block must still render; only attribution is missing.
    const grantedUnexpandedEntity = {
      ...baseEntity,
      submission_reopened_until: moment().add(24, "hours").unix(),
      submission_reopened_by_id: 5
    };

    beforeEach(() => {
      delete window.CFP_APP_BASE_URL;
    });

    afterEach(() => {
      delete window.CFP_APP_BASE_URL;
    });

    it("shows the deadline and granting admin when a grant is active", () => {
      renderEventForm({ entity: grantedEntity });

      expect(screen.getByText(/edit_event.reopened_until/)).toBeInTheDocument();
      expect(screen.getByText(/edit_event.reopened_by/)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "edit_event.reopen_submission" })
      ).not.toBeInTheDocument();
    });

    it("announces the deadline on the collapsed Materials panel title", () => {
      renderEventForm({ entity: grantedEntity });

      expect(
        screen.getByText("edit_event.materials_reopened", {
          selector: ".panel-title"
        })
      ).toBeInTheDocument();
    });

    it("still shows the reopened state when the payload was not expanded", () => {
      renderEventForm({ entity: grantedUnexpandedEntity });

      expect(screen.getByText(/edit_event.reopened_until/)).toBeInTheDocument();
      expect(
        screen.queryByText(/edit_event.reopened_by/)
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "edit_event.close_submission" })
      ).toBeInTheDocument();
    });

    it("treats an expired grant as no grant", () => {
      renderEventForm({
        entity: {
          ...grantedEntity,
          submission_reopened_until: moment().subtract(1, "hours").unix()
        }
      });

      expect(
        screen.getByRole("button", { name: "edit_event.reopen_submission" })
      ).toBeInTheDocument();
    });

    it("calls onCloseSubmission after confirmation", async () => {
      const onCloseSubmission = jest.fn().mockResolvedValue({});
      showConfirmDialog.mockResolvedValue(true);
      renderEventForm({ entity: grantedEntity, onCloseSubmission });

      await userEvent.click(
        screen.getByRole("button", { name: "edit_event.close_submission" })
      );

      await waitFor(() => expect(onCloseSubmission).toHaveBeenCalledWith(42));
    });

    it("renders the speaker deep link when CFP_APP_BASE_URL is set", () => {
      window.CFP_APP_BASE_URL = "https://cfp.example.org";
      renderEventForm({ entity: grantedEntity });

      // slug comes from currentSummitMock; selection_plan_id and id from grantedEntity
      expect(
        screen.getByText(
          "https://cfp.example.org/app/2025ocpglo/all-plans/99/presentations/42/summary"
        )
      ).toBeInTheDocument();
    });

    it("degrades without the deep link when CFP_APP_BASE_URL is unset", () => {
      delete window.CFP_APP_BASE_URL;
      renderEventForm({ entity: grantedEntity });

      expect(screen.queryByText(/\/summary$/)).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "edit_event.close_submission" })
      ).toBeInTheDocument();
    });
  });

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
