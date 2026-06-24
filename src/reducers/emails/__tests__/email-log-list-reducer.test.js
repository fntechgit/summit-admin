import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import emailLogListReducer from "../email-log-list-reducer";
import { RECEIVE_EMAILS, REQUEST_EMAILS } from "../../../actions/email-actions";

jest.mock("openstack-uicore-foundation/lib/security/actions", () => ({
  LOGOUT_USER: "LOGOUT_USER"
}));

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMomentTimeZone: jest.fn((value) => ({
    format: jest.fn(() => `formatted-${value}`)
  }))
}));

function createDefaultState() {
  return {
    emails: [],
    term: "",
    order: "id",
    orderDir: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalEmails: 0,
    filters: {}
  };
}

describe("emailLogListReducer", () => {
  let initialState;

  beforeEach(() => {
    initialState = createDefaultState();
  });

  describe("LOGOUT_USER", () => {
    it("resets to default state", () => {
      const currentState = { ...initialState, term: "foo", currentPage: 3 };
      const result = emailLogListReducer(currentState, { type: LOGOUT_USER });
      expect(result).toStrictEqual(createDefaultState());
    });
  });

  describe("REQUEST_EMAILS", () => {
    it("stores order, orderDir, term, and filters from payload", () => {
      const result = emailLogListReducer(initialState, {
        type: REQUEST_EMAILS,
        payload: {
          order: "sent_date",
          orderDir: -1,
          term: "speaker",
          filters: { is_sent_filter: "1" }
        }
      });

      expect(result.order).toBe("sent_date");
      expect(result.orderDir).toBe(-1);
      expect(result.term).toBe("speaker");
      expect(result.filters).toStrictEqual({ is_sent_filter: "1" });
    });
  });

  describe("RECEIVE_EMAILS", () => {
    // Regression test for SHOWADMIN-DEV-Z5:
    // API returns payload as a JSON object (e.g. speaker submission data).
    // Rendering a plain object as a React child throws
    // "Objects are not valid as a React child".
    // The reducer must serialize it to a JSON string before it reaches the table.
    it("serializes an object payload to a JSON string (SHOWADMIN-DEV-Z5 regression)", () => {
      const speakerPayload = {
        accepted_presentations: [],
        accepted_moderated_presentations: [],
        alternate_presentations: [],
        alternate_moderated_presentations: []
      };

      const result = emailLogListReducer(initialState, {
        type: RECEIVE_EMAILS,
        payload: {
          response: {
            total: 1,
            last_page: 1,
            current_page: 1,
            data: [
              {
                id: 1,
                template: { identifier: "speaker-accepted" },
                sent_date: 1700000000,
                last_error: null,
                payload: speakerPayload
              }
            ]
          }
        }
      });

      expect(typeof result.emails[0].payload).toBe("string");
      expect(result.emails[0].payload).toBe(JSON.stringify(speakerPayload));
    });

    it("leaves a string payload unchanged", () => {
      const result = emailLogListReducer(initialState, {
        type: RECEIVE_EMAILS,
        payload: {
          response: {
            total: 1,
            last_page: 1,
            current_page: 1,
            data: [
              {
                id: 2,
                template: { identifier: "welcome" },
                sent_date: 1700000001,
                last_error: null,
                payload: "{\"foo\":\"bar\"}"
              }
            ]
          }
        }
      });

      expect(result.emails[0].payload).toBe("{\"foo\":\"bar\"}");
    });

    it("sets payload to empty string when null", () => {
      const result = emailLogListReducer(initialState, {
        type: RECEIVE_EMAILS,
        payload: {
          response: {
            total: 1,
            last_page: 1,
            current_page: 1,
            data: [
              {
                id: 3,
                template: null,
                sent_date: null,
                last_error: "timeout",
                payload: null
              }
            ]
          }
        }
      });

      expect(result.emails[0].payload).toBe("");
    });

    it("normalizes template, sent_date, and last_error fields", () => {
      const result = emailLogListReducer(initialState, {
        type: RECEIVE_EMAILS,
        payload: {
          response: {
            total: 2,
            last_page: 1,
            current_page: 1,
            data: [
              {
                id: 10,
                template: { identifier: "my-template" },
                sent_date: 1700000000,
                last_error: null,
                payload: null
              },
              {
                id: 11,
                template: null,
                sent_date: null,
                last_error: "some error",
                payload: null
              }
            ]
          }
        }
      });

      expect(result.emails[0].template).toBe("my-template");
      expect(result.emails[0].sent_date).toBe("formatted-1700000000");
      expect(result.emails[0].last_error).toBe("N/A");

      expect(result.emails[1].template).toBe("N/A");
      expect(result.emails[1].sent_date).toBe("");
      expect(result.emails[1].last_error).toBe("some error");
    });

    it("updates pagination state from response", () => {
      const result = emailLogListReducer(initialState, {
        type: RECEIVE_EMAILS,
        payload: {
          response: {
            total: 42,
            last_page: 5,
            current_page: 3,
            data: []
          }
        }
      });

      expect(result.totalEmails).toBe(42);
      expect(result.lastPage).toBe(5);
      expect(result.currentPage).toBe(3);
    });
  });

  describe("default", () => {
    it("returns current state for unknown action", () => {
      const result = emailLogListReducer(initialState, {
        type: "UNKNOWN_ACTION"
      });
      expect(result).toStrictEqual(initialState);
    });
  });
});
