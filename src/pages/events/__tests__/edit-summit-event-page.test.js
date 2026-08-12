import React from "react";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import EditSummitEventPage from "../edit-summit-event-page";
import { renderWithRedux } from "../../../utils/test-utils";

// The form is stubbed to just the two controls under test. This suite is about how the
// page forwards its actions, not about anything the form renders.
jest.mock("../../../components/forms/event-form", () => (props) => (
  <div>
    <button type="button" onClick={() => props.onReopenSubmission(42, 24)}>
      reopen
    </button>
    <button type="button" onClick={() => props.onCloseSubmission(42)}>
      close
    </button>
  </div>
));

jest.mock("../../../actions/event-actions", () => ({
  saveEvent: jest.fn(),
  saveEventAsDraft: jest.fn(),
  saveEventFieldWithoutRefresh: jest.fn(),
  attachFile: jest.fn(),
  getEvents: jest.fn(),
  removeImage: jest.fn(),
  getEventFeedback: jest.fn(),
  deleteEventFeedback: jest.fn(),
  getEventFeedbackCSV: jest.fn(),
  changeFlag: jest.fn(),
  getActionTypes: jest.fn(() => ({ type: "GET_ACTION_TYPES_MOCK" })),
  getEventComments: jest.fn(),
  fetchExtraQuestions: jest.fn(),
  fetchExtraQuestionsAnswers: jest.fn(),
  cloneEvent: jest.fn(),
  upgradeEvent: jest.fn(),
  reopenSubmissionPeriod: jest.fn(() => ({ type: "REOPEN_SUBMISSION_MOCK" })),
  closeSubmissionPeriod: jest.fn(() => ({ type: "CLOSE_SUBMISSION_MOCK" }))
}));

const EventActions = jest.requireMock("../../../actions/event-actions");

describe("EditSummitEventPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseState = {
    currentSummitState: {
      currentSummit: { id: 12, selection_plans: [] },
      loading: false
    },
    currentSummitEventState: {
      entity: { id: 42, selection_plan_id: 99 },
      errors: {},
      levelOptions: [],
      feedbackState: { term: "", page: 1, comments: [] },
      commentState: { filters: {}, comments: [] },
      actionTypes: []
    },
    currentRsvpTemplateListState: { rsvpTemplates: [] },
    currentEventListState: {},
    auditLogState: {}
  };

  const renderPage = () =>
    renderWithRedux(<EditSummitEventPage history={{ push: jest.fn() }} />, {
      initialState: baseState
    });

  // These two assert on store.dispatch, NOT on the action creator, and that is the whole
  // point of the suite. Once the actions module is mocked, the raw module import and the
  // connect-bound prop are the same jest.fn, so `expect(creator).toHaveBeenCalled()`
  // passes even when the page forwards the un-dispatched import instead of the prop --
  // which is exactly the regression these guard (the reopen controls were inert because
  // the page never destructured the two thunks off props).
  it("dispatches the reopen thunk rather than forwarding the raw import", async () => {
    const user = userEvent.setup();
    const { store } = renderPage();

    await user.click(screen.getByText("reopen"));

    expect(EventActions.reopenSubmissionPeriod).toHaveBeenCalledWith(42, 24);
    expect(store.dispatch).toHaveBeenCalledWith({
      type: "REOPEN_SUBMISSION_MOCK"
    });
  });

  it("dispatches the close thunk rather than forwarding the raw import", async () => {
    const user = userEvent.setup();
    const { store } = renderPage();

    await user.click(screen.getByText("close"));

    expect(EventActions.closeSubmissionPeriod).toHaveBeenCalledWith(42);
    expect(store.dispatch).toHaveBeenCalledWith({
      type: "CLOSE_SUBMISSION_MOCK"
    });
  });
});
