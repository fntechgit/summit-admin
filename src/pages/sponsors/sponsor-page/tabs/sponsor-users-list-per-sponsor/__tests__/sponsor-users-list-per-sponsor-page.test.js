import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import SponsorUsersListPerSponsorPage from "../index";
import { renderWithRedux } from "../../../../../../utils/test-utils";
import {
  getSponsorUserRequests,
  getSponsorUsers,
  trackImportSponsorUsers
} from "../../../../../../actions/sponsor-users-actions";

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

jest.mock("../../../../../../actions/sponsor-users-actions", () => ({
  getSponsorUsers: jest.fn(() => ({ type: "MOCK_ACTION" })),
  getSponsorUserRequests: jest.fn(() => ({ type: "MOCK_ACTION" })),
  deleteSponsorUser: jest.fn(() => ({ type: "MOCK_ACTION" })),
  trackImportSponsorUsers: jest.fn(() => ({ type: "MOCK_ACTION" }))
}));

jest.mock(
  "../../../../sponsor-users-list-page/components/users-table",
  () => () => <div data-testid="users-table" />
);

jest.mock(
  "../../../../../../components/mui/search-input",
  () =>
    function SearchInputMock({ onSearch }) {
      return (
        <input
          data-testid="search-input"
          onChange={(e) => onSearch(e.target.value)}
        />
      );
    }
);

jest.mock("../../../../../../components/mui/custom-alert", () => () => (
  <div data-testid="custom-alert" />
));

jest.mock(
  "../../../../../../components/mui/chip-notify",
  () =>
    function ChipNotifyMock({ label, onClick }) {
      return (
        <button data-testid="chip-notify" onClick={onClick}>
          {label}
        </button>
      );
    }
);

jest.mock(
  "../components/new-user-popup",
  () =>
    function NewUserPopupMock({ onClose }) {
      return (
        <div data-testid="new-user-popup">
          <button data-testid="close-new-user-popup" onClick={onClose}>
            close
          </button>
        </div>
      );
    }
);

jest.mock(
  "../components/edit-user-popup",
  () =>
    function EditUserPopupMock({ onClose }) {
      return (
        <div data-testid="edit-user-popup">
          <button data-testid="close-edit-user-popup" onClick={onClose}>
            close
          </button>
        </div>
      );
    }
);

jest.mock(
  "../components/process-request-popup",
  () =>
    function ProcessRequestPopupMock({ onClose }) {
      return (
        <div data-testid="process-request-popup">
          <button data-testid="close-process-request-popup" onClick={onClose}>
            close
          </button>
        </div>
      );
    }
);

jest.mock(
  "../components/import-users-popup",
  () =>
    function ImportUsersPopupMock({ onClose }) {
      return (
        <div data-testid="import-users-popup">
          <button data-testid="close-import-users-popup" onClick={onClose}>
            close
          </button>
        </div>
      );
    }
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const DEFAULT_SPONSOR = { id: 123, company: { id: 456 } };

const DEFAULT_USERS = {
  items: [],
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 5
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
  sponsor = DEFAULT_SPONSOR,
  importTasks = [],
  requests = DEFAULT_REQUESTS,
  users = DEFAULT_USERS,
  term = ""
} = {}) => ({
  currentSponsorState: { entity: sponsor },
  sponsorUsersListState: { term, userGroups: [], importTasks, requests, users }
});

const renderPage = (stateOverrides = {}) =>
  renderWithRedux(<SponsorUsersListPerSponsorPage />, {
    initialState: buildState(stateOverrides)
  });

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("SponsorUsersListPerSponsorPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Data fetching on mount ─────────────────────────────────────────────────

  describe("data fetching on mount", () => {
    it("fetches sponsor users on mount using the sponsor id", () => {
      renderPage();

      expect(getSponsorUsers).toHaveBeenCalledWith(DEFAULT_SPONSOR.id);
    });

    it("fetches access requests on mount using the company id", () => {
      renderPage();

      expect(getSponsorUserRequests).toHaveBeenCalledWith(
        DEFAULT_SPONSOR.company.id
      );
    });

    it("does not fetch users when sponsor id is absent", () => {
      renderPage({ sponsor: { company: { id: 456 } } });

      expect(getSponsorUsers).not.toHaveBeenCalled();
    });

    it("does not fetch requests when company id is absent", () => {
      renderPage({ sponsor: { id: 123 } });

      expect(getSponsorUserRequests).not.toHaveBeenCalled();
    });
  });

  // ── Access request chip notification ──────────────────────────────────────

  describe("access request notification", () => {
    it("shows the chip when there are pending access requests", () => {
      renderPage({ requests: { ...DEFAULT_REQUESTS, totalCount: 3 } });

      expect(screen.getByTestId("chip-notify")).toBeInTheDocument();
    });

    it("hides the chip when there are no pending access requests", () => {
      renderPage({ requests: { ...DEFAULT_REQUESTS, totalCount: 0 } });

      expect(screen.queryByTestId("chip-notify")).not.toBeInTheDocument();
    });

    it("includes the request count in the chip label", () => {
      renderPage({ requests: { ...DEFAULT_REQUESTS, totalCount: 7 } });

      expect(screen.getByTestId("chip-notify")).toHaveTextContent("7");
    });
  });

  // ── Polling for import tasks ───────────────────────────────────────────────

  describe("polling for import tasks", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("starts polling every 10 seconds when import tasks are present", () => {
      renderPage({ importTasks: [{ id: 1, status: "running" }] });

      expect(trackImportSponsorUsers).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(trackImportSponsorUsers).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(trackImportSponsorUsers).toHaveBeenCalledTimes(2);
    });

    it("does not poll when there are no import tasks", () => {
      renderPage({ importTasks: [] });

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(trackImportSponsorUsers).not.toHaveBeenCalled();
    });

    it("clears the polling interval when the component unmounts", () => {
      const { unmount } = renderPage({
        importTasks: [{ id: 1, status: "running" }]
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(trackImportSponsorUsers).not.toHaveBeenCalled();
    });

    it("stops polling when import tasks are cleared", () => {
      // Use the inner component directly so we can update props via rerender
      // without Provider/connect wrapping interfering with effect cleanup timing.
      const UnconnectedPage = SponsorUsersListPerSponsorPage.WrappedComponent;
      const trackMock = jest.fn(() => ({ type: "MOCK_ACTION" }));
      const sharedProps = {
        sponsor: DEFAULT_SPONSOR,
        users: DEFAULT_USERS,
        requests: DEFAULT_REQUESTS,
        term: "",
        getSponsorUsers: jest.fn(),
        getSponsorUserRequests: jest.fn(),
        deleteSponsorUser: jest.fn(),
        trackImportSponsorUsers: trackMock
      };

      const { rerender } = render(
        <UnconnectedPage
          {...sharedProps}
          importTasks={[{ id: 1, status: "running" }]}
        />
      );

      act(() => {
        jest.advanceTimersByTime(10000);
      });
      expect(trackMock).toHaveBeenCalledTimes(1);

      // Update props to simulate tasks completing
      rerender(<UnconnectedPage {...sharedProps} importTasks={[]} />);

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Still only 1 call — interval was cleared when tasks were removed
      expect(trackMock).toHaveBeenCalledTimes(1);
    });
  });

  // ── Popup behavior ─────────────────────────────────────────────────────────

  describe("popup behavior", () => {
    it("opens the import popup when the import button is clicked", () => {
      renderPage();

      expect(
        screen.queryByTestId("import-users-popup")
      ).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByText("sponsor_users.import_user").closest("button")
      );

      expect(screen.getByTestId("import-users-popup")).toBeInTheDocument();
    });

    it("closes the import popup when its onClose is triggered", () => {
      renderPage();

      fireEvent.click(
        screen.getByText("sponsor_users.import_user").closest("button")
      );
      fireEvent.click(screen.getByTestId("close-import-users-popup"));

      expect(
        screen.queryByTestId("import-users-popup")
      ).not.toBeInTheDocument();
    });

    it("opens the new user popup when the add user button is clicked", () => {
      renderPage();

      expect(screen.queryByTestId("new-user-popup")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByText("sponsor_users.add_user").closest("button")
      );

      expect(screen.getByTestId("new-user-popup")).toBeInTheDocument();
    });

    it("closes the new user popup when its onClose is triggered", () => {
      renderPage();

      fireEvent.click(
        screen.getByText("sponsor_users.add_user").closest("button")
      );
      fireEvent.click(screen.getByTestId("close-new-user-popup"));

      expect(screen.queryByTestId("new-user-popup")).not.toBeInTheDocument();
    });

    it("opens the process request popup when the chip notify is clicked", () => {
      renderPage({ requests: { ...DEFAULT_REQUESTS, totalCount: 2 } });

      expect(
        screen.queryByTestId("process-request-popup")
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("chip-notify"));

      expect(screen.getByTestId("process-request-popup")).toBeInTheDocument();
    });

    it("closes the process request popup when its onClose is triggered", () => {
      renderPage({ requests: { ...DEFAULT_REQUESTS, totalCount: 2 } });

      fireEvent.click(screen.getByTestId("chip-notify"));
      fireEvent.click(screen.getByTestId("close-process-request-popup"));

      expect(
        screen.queryByTestId("process-request-popup")
      ).not.toBeInTheDocument();
    });
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  describe("search", () => {
    it("calls getSponsorUsers with the search term when the search input changes", () => {
      renderPage();
      jest.clearAllMocks();

      fireEvent.change(screen.getByTestId("search-input"), {
        target: { value: "alice" }
      });

      expect(getSponsorUsers).toHaveBeenCalledWith(DEFAULT_SPONSOR.id, "alice");
    });
  });
});
