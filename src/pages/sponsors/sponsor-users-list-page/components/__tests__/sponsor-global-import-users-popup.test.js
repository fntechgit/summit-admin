import React from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../../../utils/test-utils";
import SponsorGlobalImportUsersPopup from "../sponsor-global-import-users-popup";
import * as sponsorUsersActions from "../../../../../actions/sponsor-users-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../../../actions/sponsor-users-actions", () => {
  const original = jest.requireActual(
    "../../../../../actions/sponsor-users-actions"
  );
  return {
    __esModule: true,
    ...original,
    fetchSponsorUsersBySummit: jest.fn(),
    fetchSponsorByCompany: jest.fn(),
    importSponsorUsers: jest.fn(() => () => Promise.resolve())
  };
});

jest.mock("../../../../../actions/sponsor-actions", () => {
  const original = jest.requireActual("../../../../../actions/sponsor-actions");
  return {
    __esModule: true,
    ...original,
    querySponsors: jest.fn()
  };
});

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/summits-dropdown",
  () => ({
    __esModule: true,
    default: ({ onChange, excludeSummitIds }) => (
      <button
        data-testid="summit-select"
        type="button"
        onClick={() => onChange(2)}
      >
        {`Select Summit (excluding: ${excludeSummitIds})`}
      </button>
    )
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/async-select",
  () => {
    const React = require("react");
    const { useFormikContext } = require("formik");
    // Two entries so successive clicks return different values — required for the
    // "sponsor changes" test, which relies on the useEffect seeing a new sponsorId/companyId.
    const sponsors = [
      { value: 1, label: "Test Sponsor", companyId: 42 },
      { value: 2, label: "Other Sponsor", companyId: 99 }
    ];
    return {
      __esModule: true,
      default: ({ name }) => {
        const { setFieldValue } = useFormikContext();
        const [clickCount, setClickCount] = React.useState(0);
        return (
          <button
            data-testid="sponsor-async-select"
            type="button"
            onClick={() => {
              setFieldValue(name, sponsors[clickCount % sponsors.length]);
              setClickCount((c) => c + 1);
            }}
          >
            Select Sponsor
          </button>
        );
      }
    };
  }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/checkbox-list",
  () => ({
    __esModule: true,
    default: ({ items, onChange }) => (
      <div data-testid="checkbox-list">
        {items.map((item) => (
          <button
            key={item.id}
            data-testid={`user-item-${item.id}`}
            type="button"
            onClick={() => onChange([item.id])}
          >
            {item.name}
          </button>
        ))}
        <button
          data-testid="select-all-users"
          type="button"
          onClick={() => onChange([], true)}
        >
          Select All
        </button>
      </div>
    )
  })
);

const mockCurrentSummit = { id: 1, name: "Current Summit" };

const mockUserData = {
  data: [
    {
      id: 10,
      first_name: "Alice",
      last_name: "Smith",
      email: "alice@example.com"
    },
    {
      id: 11,
      first_name: "Bob",
      last_name: "Jones",
      email: "bob@example.com"
    }
  ],
  current_page: 1,
  last_page: 1
};

const baseState = {
  currentSummitState: { currentSummit: mockCurrentSummit }
};

const renderPopup = (props = {}) =>
  renderWithRedux(
    <SponsorGlobalImportUsersPopup
      onClose={jest.fn()}
      summitId={mockCurrentSummit.id}
      {...props}
    />,
    { initialState: baseState }
  );

const selectSummitAndSponsor = async () => {
  await act(async () => {
    await userEvent.click(screen.getByTestId("summit-select"));
  });
  await act(async () => {
    await userEvent.click(screen.getByTestId("sponsor-async-select"));
  });
  await waitFor(() => {
    expect(screen.getByTestId("checkbox-list")).toBeInTheDocument();
  });
};

describe("SponsorGlobalImportUsersPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sponsorUsersActions.fetchSponsorUsersBySummit.mockResolvedValue(
      mockUserData
    );
    sponsorUsersActions.fetchSponsorByCompany.mockResolvedValue({
      id: 999,
      name: "Test Sponsor"
    });
    sponsorUsersActions.importSponsorUsers.mockReturnValue(() =>
      Promise.resolve()
    );
  });

  it("renders the title, summit dropdown and excludes the current summit", () => {
    renderPopup();

    expect(
      screen.getByText("sponsor_users.import_users.title")
    ).toBeInTheDocument();
    expect(screen.getByTestId("summit-select")).toBeInTheDocument();
    expect(
      screen.getByText(`Select Summit (excluding: ${mockCurrentSummit.id})`)
    ).toBeInTheDocument();
  });

  it("shows the sponsor dropdown after a summit is selected", async () => {
    renderPopup();

    await act(async () => {
      await userEvent.click(screen.getByTestId("summit-select"));
    });

    expect(screen.getByTestId("sponsor-async-select")).toBeInTheDocument();
  });

  it("calls fetchSponsorUsersBySummit with the correct params when summit and sponsor are selected", async () => {
    renderPopup();

    await act(async () => {
      await userEvent.click(screen.getByTestId("summit-select"));
    });
    await act(async () => {
      await userEvent.click(screen.getByTestId("sponsor-async-select"));
    });

    await waitFor(() => {
      expect(
        sponsorUsersActions.fetchSponsorUsersBySummit
      ).toHaveBeenCalledWith(
        mockCurrentSummit.id, // currentSummitId
        2, // selectedSummitId
        42, // companyId
        1 // page
      );
    });
  });

  it("shows the user list and keeps import button disabled until a user is selected", async () => {
    renderPopup();

    await selectSummitAndSponsor();

    expect(screen.getByTestId("user-item-10")).toBeInTheDocument();
    expect(screen.getByTestId("user-item-11")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "sponsor_users.import_users.import_users"
      })
    ).toBeDisabled();

    await act(async () => {
      await userEvent.click(screen.getByTestId("user-item-10"));
    });

    expect(
      screen.getByRole("button", {
        name: "sponsor_users.import_users.import_users"
      })
    ).not.toBeDisabled();
  });

  it("calls importSponsorUsers with correct params and closes on success", async () => {
    const onClose = jest.fn();
    renderPopup({ onClose });

    await selectSummitAndSponsor();

    await act(async () => {
      await userEvent.click(screen.getByTestId("user-item-10"));
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", {
          name: "sponsor_users.import_users.import_users"
        })
      );
    });

    await waitFor(() => {
      expect(sponsorUsersActions.fetchSponsorByCompany).toHaveBeenCalledWith(
        42, // companyId
        mockCurrentSummit.id // current (target) summitId
      );
      expect(sponsorUsersActions.importSponsorUsers).toHaveBeenCalledWith(
        999, // sponsorId resolved via fetchSponsorByCompany for the target summit
        42, // companyId
        2, // selectedSummitId
        [10] // selectedUsers
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("calls importSponsorUsers with 'all' when select all is used", async () => {
    renderPopup();

    await selectSummitAndSponsor();

    await act(async () => {
      await userEvent.click(screen.getByTestId("select-all-users"));
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", {
          name: "sponsor_users.import_users.import_users"
        })
      );
    });

    await waitFor(() => {
      expect(sponsorUsersActions.importSponsorUsers).toHaveBeenCalledWith(
        1,
        42,
        2,
        "all"
      );
    });
  });

  it("clears user list and selection immediately when sponsor changes", async () => {
    renderPopup();

    // first sponsor selection — loads users, picks one
    await selectSummitAndSponsor();
    await act(async () => {
      await userEvent.click(screen.getByTestId("user-item-10"));
    });
    expect(
      screen.getByRole("button", {
        name: "sponsor_users.import_users.import_users"
      })
    ).not.toBeDisabled();

    // change sponsor — user list must disappear before the new fetch resolves
    sponsorUsersActions.fetchSponsorUsersBySummit.mockReturnValueOnce(
      new Promise(() => {})
    ); // never resolves
    await act(async () => {
      await userEvent.click(screen.getByTestId("sponsor-async-select"));
    });

    expect(screen.queryByTestId("user-item-10")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "sponsor_users.import_users.import_users"
      })
    ).toBeDisabled();
  });
});
