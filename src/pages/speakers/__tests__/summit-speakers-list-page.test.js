import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../utils/test-utils";
import SummitSpeakerListPage from "../summit-speakers-list-page";
import * as speakerActions from "../../../actions/speaker-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, onEdit, onDelete }) => (
    <div data-testid="mui-table">
      {data.map((row) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          <span>{row.name}</span>
          {onEdit && (
            <button type="button" onClick={() => onEdit(row)}>
              edit-row
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={() => onDelete(row.id)}>
              delete-row
            </button>
          )}
        </div>
      ))}
    </div>
  )
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/search-input", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onSearch, term }) => {
      const [value, setValue] = React.useState(term || "");
      return (
        <input
          data-testid="search-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch(value);
          }}
        />
      );
    }
  };
});

jest.mock("../../../actions/speaker-actions", () => ({
  ...jest.requireActual("../../../actions/speaker-actions"),
  getSpeakers: jest.fn(() => () => Promise.resolve()),
  deleteSpeaker: jest.fn(() => () => Promise.resolve())
}));

// Mock Member so permissions are easy to control per test
jest.mock("../../../models/member", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    canAddSpeakers: jest.fn(() => true),
    canEditSpeakers: jest.fn(() => true),
    canDeleteSpeakers: jest.fn(() => true)
  }))
}));

const mockHistory = { push: jest.fn() };

const SAMPLE_SPEAKERS = [
  { id: 1, name: "Alice Smith", email: "alice@example.com", member_id: 10 },
  { id: 2, name: "Bob Jones", email: "bob@example.com", member_id: 20 }
];

const buildInitialState = (listOverrides = {}) => ({
  currentSpeakerListState: {
    speakers: [],
    term: "",
    order: "id",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalSpeakers: 0,
    ...listOverrides
  },
  loggedUserState: { member: { groups: [] } }
});

const allPermissions = {
  canAddSpeakers: jest.fn(() => true),
  canEditSpeakers: jest.fn(() => true),
  canDeleteSpeakers: jest.fn(() => true)
};

describe("SummitSpeakerListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const Member = require("../../../models/member").default;
    Member.mockImplementation(() => ({ ...allPermissions }));
  });

  test("should call getSpeakers on mount", async () => {
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState()
    });

    await waitFor(() => {
      expect(speakerActions.getSpeakers).toHaveBeenCalledTimes(1);
    });
  });

  test("should show empty state message when no speakers", () => {
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState()
    });

    expect(screen.getByText("speaker_list.no_results")).toBeInTheDocument();
    expect(screen.queryByTestId("mui-table")).not.toBeInTheDocument();
  });

  test("should show table and total count when speakers are present", () => {
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState({
        speakers: SAMPLE_SPEAKERS,
        totalSpeakers: 2
      })
    });

    expect(screen.getByTestId("mui-table")).toBeInTheDocument();
    expect(screen.getByText(/2\sspeaker_list\.speakers/)).toBeInTheDocument();
    expect(
      screen.queryByText("speaker_list.no_results")
    ).not.toBeInTheDocument();
  });

  test("should show Add button when canAddSpeakers is true", () => {
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState()
    });

    expect(screen.getByText("speaker_list.add_speaker")).toBeInTheDocument();
  });

  test("should hide Add button when canAddSpeakers is false", () => {
    const Member = require("../../../models/member").default;
    Member.mockImplementation(() => ({
      canAddSpeakers: jest.fn(() => false),
      canEditSpeakers: jest.fn(() => true),
      canDeleteSpeakers: jest.fn(() => true)
    }));

    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState()
    });

    expect(
      screen.queryByText("speaker_list.add_speaker")
    ).not.toBeInTheDocument();
  });

  test("should navigate to new speaker page on Add button click", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState()
    });

    await user.click(screen.getByText("speaker_list.add_speaker"));

    expect(mockHistory.push).toHaveBeenCalledWith("/app/speakers/new");
  });

  test("should navigate to speaker edit page on row edit", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState({
        speakers: SAMPLE_SPEAKERS,
        totalSpeakers: 2
      })
    });

    await user.click(screen.getAllByText("edit-row")[0]);

    expect(mockHistory.push).toHaveBeenCalledWith("/app/speakers/1");
  });

  test("should call deleteSpeaker and refreshes on row delete", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState({
        speakers: SAMPLE_SPEAKERS,
        totalSpeakers: 2
      })
    });

    await user.click(screen.getAllByText("delete-row")[0]);

    await waitFor(() => {
      expect(speakerActions.deleteSpeaker).toHaveBeenCalledWith(1);
    });
  });

  test("should call getSpeakers with search term on Enter", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SummitSpeakerListPage history={mockHistory} />, {
      initialState: buildInitialState()
    });

    await user.type(screen.getByTestId("search-input"), "alice{Enter}");

    await waitFor(() => {
      expect(speakerActions.getSpeakers).toHaveBeenCalledWith(
        "alice",
        1,
        10,
        "id",
        1
      );
    });
  });
});
