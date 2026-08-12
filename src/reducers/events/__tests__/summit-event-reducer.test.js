import summitEventReducer from "../summit-event-reducer";
import {
  SUBMISSION_PERIOD_REOPENED,
  SUBMISSION_PERIOD_CLOSED
} from "../../../actions/event-actions";

describe("summitEventReducer submission period", () => {
  const stateForEvent = (id, overrides = {}) => ({
    entity: {
      id,
      title: "A TALK",
      selection_plan_id: 99,
      submission_reopened_until: "",
      submission_reopened_by_id: 0,
      submission_reopened_by: null,
      ...overrides
    },
    errors: {}
  });

  const reopenedResponse = {
    submission_reopened_until: 1786550400,
    submission_reopened_by: {
      id: 5,
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.org"
    }
  };

  it("applies a reopen response to the activity it was issued for", () => {
    const next = summitEventReducer(stateForEvent(42), {
      type: SUBMISSION_PERIOD_REOPENED,
      payload: { eventId: 42, response: reopenedResponse }
    });

    expect(next.entity.submission_reopened_until).toBe(1786550400);
    expect(next.entity.submission_reopened_by.first_name).toBe("Ada");
  });

  // The admin grants on activity A, navigates to B before the request finishes, B loads,
  // then A's response lands. Without the eventId guard it merges A's grant onto B.
  it("ignores a reopen response that arrives after the admin moved to another activity", () => {
    const stateOnB = stateForEvent(43);

    const next = summitEventReducer(stateOnB, {
      type: SUBMISSION_PERIOD_REOPENED,
      payload: { eventId: 42, response: reopenedResponse }
    });

    expect(next).toBe(stateOnB);
    expect(next.entity.submission_reopened_until).toBe("");
    expect(next.entity.submission_reopened_by).toBeNull();
  });

  it("clears the grant on the activity the close was issued for", () => {
    const granted = stateForEvent(42, {
      submission_reopened_until: 1786550400,
      submission_reopened_by_id: 5,
      submission_reopened_by: { id: 5 }
    });

    const next = summitEventReducer(granted, {
      type: SUBMISSION_PERIOD_CLOSED,
      payload: { eventId: 42 }
    });

    expect(next.entity.submission_reopened_until).toBe("");
    expect(next.entity.submission_reopened_by_id).toBe(0);
    expect(next.entity.submission_reopened_by).toBeNull();
  });

  it("ignores a close response that arrives after the admin moved to another activity", () => {
    const grantedOnB = stateForEvent(43, {
      submission_reopened_until: 1786550400,
      submission_reopened_by_id: 5,
      submission_reopened_by: { id: 5 }
    });

    const next = summitEventReducer(grantedOnB, {
      type: SUBMISSION_PERIOD_CLOSED,
      payload: { eventId: 42 }
    });

    expect(next).toBe(grantedOnB);
    expect(next.entity.submission_reopened_until).toBe(1786550400);
  });

  // The server sends null for an ungranted window, and this response does not pass
  // through normalizeEventResponse, so the nulls arrive as real nulls rather than "".
  it("coerces a null reopen response back to the empty-state defaults", () => {
    const next = summitEventReducer(stateForEvent(42), {
      type: SUBMISSION_PERIOD_REOPENED,
      payload: {
        eventId: 42,
        response: {
          submission_reopened_until: null,
          submission_reopened_by_id: null,
          submission_reopened_by: null
        }
      }
    });

    expect(next.entity.submission_reopened_until).toBe("");
    expect(next.entity.submission_reopened_by_id).toBe(0);
    expect(next.entity.submission_reopened_by).toBeNull();
  });
});
