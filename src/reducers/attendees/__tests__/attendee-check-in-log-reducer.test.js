import reducer, { formatActor } from "../attendee-check-in-log-reducer";
import {
  CLEAR_ATTENDEE_CHECK_IN_LOGS,
  RECEIVE_ATTENDEE_CHECK_IN_LOGS
} from "../../../actions/attendee-check-in-log-actions";

describe("attendeeCheckInLogReducer", () => {
  it("formats actor as member or falls back to client id", () => {
    expect(
      formatActor({
        actor: { first_name: "Ann", last_name: "Lee", email: "a@x.com" }
      })
    ).toBe("Ann Lee (a@x.com)");
    expect(formatActor({ actor: null, client_id: "scan-app" })).toBe(
      "scan-app"
    );
    expect(formatActor({})).toBe("N/A");
  });

  it("stores formatted logs and pagination on receive", () => {
    const state = reducer(undefined, {
      type: RECEIVE_ATTENDEE_CHECK_IN_LOGS,
      payload: {
        response: {
          data: [
            {
              id: 1,
              action: "CHECKED_OUT",
              source: "ADMIN_UI",
              reason: null,
              ip_address: "1.2.3.4",
              created: 1700000000,
              client_id: "admin"
            }
          ],
          current_page: 1,
          last_page: 3,
          total: 25
        }
      }
    });

    expect(state.logs).toHaveLength(1);
    expect(state.logs[0].reason).toBe("-");
    expect(state.logs[0].actor_email).toBe("admin");
    expect(state.lastPage).toBe(3);
    expect(state.totalLogs).toBe(25);
  });

  it("resets on clear", () => {
    const state = reducer(
      { logs: [{ id: 1 }], totalLogs: 1 },
      { type: CLEAR_ATTENDEE_CHECK_IN_LOGS, payload: {} }
    );
    expect(state.logs).toEqual([]);
  });
});
