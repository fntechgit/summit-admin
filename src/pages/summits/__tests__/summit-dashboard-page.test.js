import React from "react";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import SummitDashboardPage from "../summit-dashboard-page";
import { getRegistrationData } from "../../../actions/summit-stats-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

// Provide real access-routes data so Member gates correctly.
// Without this the YAML transform stub returns "" and hasAccess() always returns true.
jest.mock("../../../access-routes.yml", () => ({
  "summit-edit": [
    "super-admins",
    "administrators",
    "summit-front-end-administrators"
  ]
}));

jest.mock("../../../actions/summit-actions", () => ({
  getSummitById: jest.fn(() => ({ type: "MOCK_GET_SUMMIT" }))
}));

jest.mock("../../../actions/summit-stats-actions", () => ({
  getRegistrationData: jest.fn(() => ({ type: "MOCK_GET_REG_DATA" }))
}));

const buildState = (groups) => ({
  currentSummitState: {
    currentSummit: {
      id: 75,
      name: "Test Show",
      time_zone: { name: "UTC" },
      start_date: 1750000000,
      end_date: 1750100000,
      registration_begin_date: 1749000000,
      registration_end_date: 1750000000,
      selection_plans: [],
      locations: [],
      speakers_count: 0,
      presentations_submitted_count: 0,
      published_events_count: 0,
      speaker_announcement_email_accepted_count: 0,
      speaker_announcement_email_rejected_count: 0,
      speaker_announcement_email_alternate_count: 0,
      speaker_announcement_email_accepted_alternate_count: 0,
      speaker_announcement_email_accepted_rejected_count: 0,
      speaker_announcement_email_alternate_rejected_count: 0
    }
  },
  loggedUserState: { member: { groups } },
  summitStatsState: { total_orders: 0, total_active_tickets: 0 }
});

const renderPage = (groups) =>
  renderWithRedux(<SummitDashboardPage match={{ url: "/app/summits/75" }} />, {
    initialState: buildState(groups)
  });

describe("SummitDashboardPage registration stats fetch", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not fetch registration stats for a sponsors-only member", () => {
    renderPage([{ code: "sponsors" }]);

    expect(getRegistrationData).not.toHaveBeenCalled();
  });

  it("fetches registration stats for an admin member", () => {
    renderPage([{ code: "administrators" }]);

    expect(getRegistrationData).toHaveBeenCalled();
  });
});
