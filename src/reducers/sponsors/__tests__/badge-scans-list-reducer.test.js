import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import badgeScansListReducer from "../badge-scans-list-reducer";
import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";
import {
  REQUEST_BADGE_SCANS,
  RECEIVE_BADGE_SCANS,
  RECEIVE_SPONSORS_WITH_SCANS
} from "../../../actions/sponsor-actions";

jest.mock("openstack-uicore-foundation/lib/utils/methods", () => ({
  epochToMomentTimeZone: jest.fn((value, tz) => ({
    format: jest.fn(() => `formatted-${value}-${tz}`)
  }))
}));

function createDefaultState() {
  return {
    badgeScans: [],
    sponsorId: null,
    term: "",
    order: "attendee_last_name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalBadgeScans: 0,
    allSponsors: [],
    summitTZ: ""
  };
}

describe("badgeScansListReducer", () => {
  let initialState;
  let result;

  beforeEach(() => {
    initialState = createDefaultState();
    result = undefined;
  });

  describe("SET_CURRENT_SUMMIT", () => {
    it("execution", () => {
      const currentState = {
        ...initialState,
        term: "active-filter",
        currentPage: 3,
        perPage: 50
      };
      const defaultState = createDefaultState();

      result = badgeScansListReducer(currentState, {
        type: SET_CURRENT_SUMMIT
      });

      expect(result).toStrictEqual(defaultState);
      expect(result).not.toStrictEqual(currentState);
    });
  });

  describe("LOGOUT_USER", () => {
    it("execution", () => {
      const currentState = {
        ...initialState,
        term: "active-filter",
        currentPage: 3,
        perPage: 50
      };
      const defaultState = createDefaultState();

      result = badgeScansListReducer(currentState, {
        type: LOGOUT_USER
      });

      expect(result).toStrictEqual(defaultState);
      expect(result).not.toStrictEqual(currentState);
    });
  });

  describe("REQUEST_BADGE_SCANS", () => {
    it("stores page and perPage from payload", () => {
      result = badgeScansListReducer(initialState, {
        type: REQUEST_BADGE_SCANS,
        payload: {
          term: "john",
          order: "scan_date",
          orderDir: -1,
          sponsorId: 99,
          summitTZ: "America/Chicago",
          page: 1,
          perPage: 50
        }
      });

      expect(result).toStrictEqual({
        ...initialState,
        term: "john",
        order: "scan_date",
        orderDir: -1,
        sponsorId: 99,
        summitTZ: "America/Chicago",
        currentPage: 1,
        perPage: 50
      });
    });

    it("resets to first page when changing rows per page from page 2", () => {
      const stateOnSecondPage = {
        ...initialState,
        currentPage: 2,
        perPage: 20,
        term: "john"
      };

      result = badgeScansListReducer(stateOnSecondPage, {
        type: REQUEST_BADGE_SCANS,
        payload: {
          term: "john",
          order: "scan_date",
          orderDir: 1,
          sponsorId: 99,
          summitTZ: "America/Chicago",
          page: 1,
          perPage: 50
        }
      });

      expect(result.currentPage).toBe(1);
      expect(result.perPage).toBe(50);
    });
  });

  describe("RECEIVE_BADGE_SCANS", () => {
    it("maps badge scans for owner and attendee paths", () => {
      result = badgeScansListReducer(
        {
          ...initialState,
          summitTZ: "America/Chicago"
        },
        {
          type: RECEIVE_BADGE_SCANS,
          payload: {
            response: {
              current_page: 2,
              total: 3,
              last_page: 3,
              data: [
                {
                  id: 10,
                  scan_date: 1700000000,
                  scanned_by: {
                    first_name: "Agent",
                    last_name: "One",
                    email: "agent1@acme.com"
                  },
                  badge: {
                    ticket: {
                      owner: {
                        member: {
                          first_name: "Member",
                          last_name: "Owner"
                        },
                        email: "member@acme.com",
                        company: "Acme"
                      }
                    }
                  }
                },
                {
                  id: 11,
                  created: 1700000001,
                  scanned_by: {
                    first_name: "Agent",
                    last_name: "Two"
                  },
                  badge: {
                    ticket: {
                      owner: {
                        first_name: "Fallback",
                        last_name: "Name",
                        email: "fallback@acme.com"
                      }
                    }
                  }
                },
                {
                  id: 12,
                  scan_date: 1700000002,
                  scanned_by: {
                    first_name: "Agent",
                    last_name: "Three",
                    email: "agent3@acme.com"
                  },
                  badge: {
                    ticket: {
                      owner: {
                        member: {
                          first_name: "Should",
                          last_name: "BeOverridden"
                        },
                        email: "owner@acme.com",
                        company: "Owner Co"
                      }
                    }
                  },
                  attendee_first_name: "Attendee",
                  attendee_last_name: "Override",
                  attendee_email: "attendee@acme.com"
                }
              ]
            }
          }
        }
      );

      expect(result.currentPage).toBe(2);
      expect(result.totalBadgeScans).toBe(3);
      expect(result.lastPage).toBe(3);

      expect(result.badgeScans).toStrictEqual([
        {
          id: 10,
          attendee_first_name: "Member",
          attendee_last_name: "Owner",
          attendee_email: "member@acme.com",
          scan_date: "formatted-1700000000-America/Chicago",
          scanned_by: "Agent One (agent1@acme.com)",
          attendee_company: "Acme"
        },
        {
          id: 11,
          attendee_first_name: "Fallback",
          attendee_last_name: "Name",
          attendee_email: "fallback@acme.com",
          scan_date: "formatted-1700000001-America/Chicago",
          scanned_by: "Agent Two ",
          attendee_company: "N/A"
        },
        {
          id: 12,
          attendee_first_name: "Attendee",
          attendee_last_name: "Override",
          attendee_email: "attendee@acme.com",
          scan_date: "formatted-1700000002-America/Chicago",
          scanned_by: "Agent Three (agent3@acme.com)",
          attendee_company: "N/A"
        }
      ]);
    });

    it("covers owner fallback branches and no-owner branch", () => {
      result = badgeScansListReducer(
        {
          ...initialState,
          summitTZ: "America/Chicago"
        },
        {
          type: RECEIVE_BADGE_SCANS,
          payload: {
            response: {
              current_page: 1,
              total: 2,
              last_page: 1,
              data: [
                {
                  id: 20,
                  scan_date: 1700000010,
                  scanned_by: {
                    first_name: "Agent",
                    last_name: "Four"
                  },
                  badge: {
                    ticket: {
                      owner: {
                        email: "nameless@acme.com"
                      }
                    }
                  }
                },
                {
                  id: 21,
                  created: 1700000011,
                  scanned_by: {
                    first_name: "Agent",
                    last_name: "Five"
                  },
                  attendee_first_name: "OnlyAttendee",
                  attendee_last_name: "NoOwner",
                  attendee_email: "only.attendee@acme.com",
                  attendee_company: "Attendee Co"
                }
              ]
            }
          }
        }
      );

      expect(result.badgeScans).toStrictEqual([
        {
          id: 20,
          attendee_first_name: "",
          attendee_last_name: "",
          attendee_email: "nameless@acme.com",
          scan_date: "formatted-1700000010-America/Chicago",
          scanned_by: "Agent Four ",
          attendee_company: "N/A"
        },
        {
          id: 21,
          attendee_first_name: "OnlyAttendee",
          attendee_last_name: "NoOwner",
          attendee_email: "only.attendee@acme.com",
          scan_date: "formatted-1700000011-America/Chicago",
          scanned_by: "Agent Five ",
          attendee_company: "Attendee Co"
        }
      ]);
    });
  });

  describe("RECEIVE_SPONSORS_WITH_SCANS", () => {
    it("replaces sponsors on first page", () => {
      const currentState = {
        ...initialState,
        allSponsors: [{ id: 1, name: "Old" }]
      };

      result = badgeScansListReducer(currentState, {
        type: RECEIVE_SPONSORS_WITH_SCANS,
        payload: {
          response: {
            current_page: 1,
            data: [{ id: 2, name: "New" }]
          }
        }
      });

      expect(result.allSponsors).toStrictEqual([{ id: 2, name: "New" }]);
    });

    it("appends sponsors on next pages", () => {
      const currentState = {
        ...initialState,
        allSponsors: [{ id: 1, name: "First" }]
      };

      result = badgeScansListReducer(currentState, {
        type: RECEIVE_SPONSORS_WITH_SCANS,
        payload: {
          response: {
            current_page: 2,
            data: [{ id: 2, name: "Second" }]
          }
        }
      });

      expect(result.allSponsors).toStrictEqual([
        { id: 1, name: "First" },
        { id: 2, name: "Second" }
      ]);
    });
  });

  describe("default", () => {
    it("returns current state for unknown action", () => {
      result = badgeScansListReducer(initialState, {
        type: "UNKNOWN_ACTION"
      });

      expect(result).toStrictEqual(initialState);
    });

    it("returns default state when state is undefined", () => {
      result = badgeScansListReducer(undefined, {
        type: "UNKNOWN_ACTION"
      });

      expect(result).toStrictEqual(createDefaultState());
    });

    it("returns default state when called without args", () => {
      result = badgeScansListReducer();

      expect(result).toStrictEqual(createDefaultState());
    });
  });
});
