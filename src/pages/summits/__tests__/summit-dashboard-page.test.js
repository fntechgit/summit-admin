import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithRedux } from "../../../utils/test-utils";
import SummitDashboardPage from "../summit-dashboard-page";
import { getRegistrationData } from "../../../actions/summit-stats-actions";
import { deleteSummit } from "../../../actions/summit-actions";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";

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
  ],
  "summit-delete": ["super-admins", "administrators"]
}));

jest.mock("../../../components/mui/showConfirmDialog", () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock("../../../actions/summit-actions", () => ({
  getSummitById: jest.fn(() => ({ type: "MOCK_GET_SUMMIT" })),
  deleteSummit: jest.fn(() => ({ type: "MOCK_DELETE_SUMMIT" }))
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

const renderPage = (groups, history = { push: jest.fn() }) =>
  renderWithRedux(
    <SummitDashboardPage
      match={{ url: "/app/summits/75" }}
      history={history}
    />,
    { initialState: buildState(groups) }
  );

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

describe("SummitDashboardPage title actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hides edit and delete for a sponsors-only member", () => {
    renderPage([{ code: "sponsors" }]);

    expect(screen.queryByTestId("summit-edit")).not.toBeInTheDocument();
    expect(screen.queryByTestId("summit-delete")).not.toBeInTheDocument();
  });

  it("navigates to the edit page when clicking edit", () => {
    const history = { push: jest.fn() };
    renderPage([{ code: "administrators" }], history);

    fireEvent.click(screen.getByTestId("summit-edit"));

    expect(history.push).toHaveBeenCalledWith("/app/summits/75");
  });

  it("deletes the summit and returns to the list once confirmed", async () => {
    showConfirmDialog.mockResolvedValue(true);
    const history = { push: jest.fn() };
    renderPage([{ code: "administrators" }], history);

    fireEvent.click(screen.getByTestId("summit-delete"));

    await waitFor(() =>
      expect(history.push).toHaveBeenCalledWith("/app/summits")
    );
    expect(deleteSummit).toHaveBeenCalledWith(75);
  });

  it("does not delete the summit when cancelled", async () => {
    showConfirmDialog.mockResolvedValue(false);
    const history = { push: jest.fn() };
    renderPage([{ code: "administrators" }], history);

    fireEvent.click(screen.getByTestId("summit-delete"));

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
    expect(deleteSummit).not.toHaveBeenCalled();
    expect(history.push).not.toHaveBeenCalled();
  });
});
