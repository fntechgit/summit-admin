import React from "react";
import { act, render, screen } from "@testing-library/react";
import SponsorUsersListPage from "../index";
import { renderWithRedux } from "../../../../utils/test-utils";
import {
  getSponsorUserRequests,
  getSponsorUsers,
  trackImportSponsorUsers
} from "../../../../actions/sponsor-users-actions";
import { TEN_SECONDS_IN_MILLISECONDS } from "../../../../utils/constants";

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

jest.mock("../../../../actions/sponsor-users-actions", () => ({
  getSponsorUsers: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorUserRequests: jest.fn(() => ({ type: "MOCK_ACTION" })),
  deleteSponsorUser: jest.fn(() => ({ type: "MOCK_ACTION" })),
  deleteSponsorUserRequest: jest.fn(() => ({ type: "MOCK_ACTION" })),
  trackImportSponsorUsers: jest.fn(() => ({ type: "MOCK_ACTION" }))
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => <div data-testid="breadcrumb" />
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () =>
    function SearchInputMock() {
      return <div data-testid="search-input" />;
    }
);

jest.mock("../components/request-table", () => () => (
  <div data-testid="request-table" />
));

jest.mock("../components/users-table", () => () => (
  <div data-testid="users-table" />
));

jest.mock("../components/sponsor-global-new-user-popup", () => () => (
  <div data-testid="new-user-popup" />
));

jest.mock("../components/sponsor-global-import-users-popup", () => () => (
  <div data-testid="import-users-popup" />
));

jest.mock("../components/edit-user-popup", () => () => (
  <div data-testid="edit-user-popup" />
));

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_USERS = {
  items: [],
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0
};

const DEFAULT_REQUESTS = {
  items: [],
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0
};

const buildState = ({
  summitId = 1,
  importTasks = [],
  requests = DEFAULT_REQUESTS,
  users = DEFAULT_USERS,
  term = ""
} = {}) => ({
  currentSummitState: { currentSummit: { id: summitId } },
  sponsorUsersListState: { term, userGroups: [], importTasks, requests, users }
});

const renderPage = (stateOverrides = {}) =>
  renderWithRedux(<SponsorUsersListPage match={{ url: "/sponsor-users" }} />, {
    initialState: buildState(stateOverrides)
  });

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("SponsorUsersListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("data fetching on mount", () => {
    it("fetches sponsor users and access requests on mount", () => {
      renderPage();

      expect(getSponsorUsers).toHaveBeenCalled();
      expect(getSponsorUserRequests).toHaveBeenCalled();
    });
  });

  describe("polling for import tasks", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("polls trackImportSponsorUsers while an import task is pending", () => {
      renderPage({ importTasks: [123] });

      expect(trackImportSponsorUsers).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(TEN_SECONDS_IN_MILLISECONDS);
      });

      expect(trackImportSponsorUsers).toHaveBeenCalledTimes(1);
    });

    it("does not poll when there are no import tasks", () => {
      renderPage({ importTasks: [] });

      act(() => {
        jest.advanceTimersByTime(TEN_SECONDS_IN_MILLISECONDS * 3);
      });

      expect(trackImportSponsorUsers).not.toHaveBeenCalled();
    });

    it("stops polling once importTasks is cleared", () => {
      // Use the inner component directly so we can update props via rerender
      // without Provider/connect wrapping interfering with effect cleanup timing.
      const UnconnectedPage = SponsorUsersListPage.WrappedComponent;
      const trackMock = jest.fn(() => ({ type: "MOCK_ACTION" }));
      const sharedProps = {
        summitId: 1,
        match: { url: "/sponsor-users" },
        users: DEFAULT_USERS,
        requests: DEFAULT_REQUESTS,
        term: "",
        getSponsorUserRequests: jest.fn(),
        getSponsorUsers: jest.fn(),
        deleteSponsorUserRequest: jest.fn(),
        deleteSponsorUser: jest.fn(),
        trackImportSponsorUsers: trackMock
      };

      const { rerender } = render(
        <UnconnectedPage {...sharedProps} importTasks={[123]} />
      );

      act(() => {
        jest.advanceTimersByTime(TEN_SECONDS_IN_MILLISECONDS);
      });
      expect(trackMock).toHaveBeenCalledTimes(1);

      rerender(<UnconnectedPage {...sharedProps} importTasks={[]} />);

      act(() => {
        jest.advanceTimersByTime(TEN_SECONDS_IN_MILLISECONDS * 3);
      });

      // Still only 1 call — interval was cleared when tasks were removed
      expect(trackMock).toHaveBeenCalledTimes(1);
    });

    it("clears the polling interval when the component unmounts", () => {
      const { unmount } = renderPage({ importTasks: [123] });

      unmount();

      act(() => {
        jest.advanceTimersByTime(TEN_SECONDS_IN_MILLISECONDS * 3);
      });

      expect(trackImportSponsorUsers).not.toHaveBeenCalled();
    });
  });

  describe("import-in-progress indicator", () => {
    it("shows the indicator while an import task is pending", () => {
      renderPage({ importTasks: [123] });

      expect(
        screen.getByText("sponsor_users.import_users.in_progress")
      ).toBeInTheDocument();
    });

    it("hides the indicator when there are no import tasks", () => {
      renderPage({ importTasks: [] });

      expect(
        screen.queryByText("sponsor_users.import_users.in_progress")
      ).not.toBeInTheDocument();
    });
  });
});
