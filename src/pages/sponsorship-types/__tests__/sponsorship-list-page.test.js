import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../utils/test-utils";
import SponsorshipListPage from "../sponsorship-list-page";
import * as sponsorshipActions from "../../../actions/sponsorship-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ value: true }))
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/table",
  () =>
    function MockMuiTable({ data, onEdit, onDelete }) {
      return (
        <div data-testid="mui-table">
          {data.map((row) => (
            <div key={row.id} data-testid={`row-${row.id}`}>
              <button
                data-testid={`edit-${row.id}`}
                onClick={() => onEdit(row)}
              >
                Edit
              </button>
              <button
                data-testid={`delete-${row.id}`}
                onClick={() => onDelete(row.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      );
    }
);

jest.mock(
  "../components/sponsorship-dialog",
  () =>
    function MockSponsorshipDialog({ onSave, onClose }) {
      return (
        <div data-testid="sponsorship-dialog">
          <button
            data-testid="dialog-save"
            onClick={() => onSave({ id: 0, name: "New Tier" })}
          >
            Save
          </button>
          <button data-testid="dialog-close" onClick={onClose}>
            Close
          </button>
        </div>
      );
    }
);

jest.mock("../../../actions/sponsorship-actions", () => {
  const original = jest.requireActual("../../../actions/sponsorship-actions");
  return {
    __esModule: true,
    ...original,
    getSponsorships: jest.fn(() => () => Promise.resolve()),
    getSponsorship: jest.fn(() => () => Promise.resolve()),
    saveSponsorship: jest.fn(() => () => Promise.resolve()),
    deleteSponsorship: jest.fn(() => () => Promise.resolve()),
    resetSponsorshipForm: jest.fn(() => ({ type: "RESET_SPONSORSHIP_FORM" }))
  };
});

const SPONSORSHIPS = [
  { id: 1, name: "Gold", label: "Gold Tier", size: "Large" },
  { id: 2, name: "Silver", label: "Silver Tier", size: "Medium" }
];

const buildState = (listOverrides = {}) => ({
  currentSponsorshipListState: {
    sponsorships: SPONSORSHIPS,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    order: "name",
    orderDir: 1,
    totalSponsorships: 2,
    ...listOverrides
  },
  currentSponsorshipState: {
    entity: { id: 0, name: "", label: "", size: "", order: 0 },
    errors: {}
  }
});

describe("SponsorshipListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call getSponsorships on mount", () => {
    renderWithRedux(<SponsorshipListPage />, { initialState: buildState() });
    expect(sponsorshipActions.getSponsorships).toHaveBeenCalledTimes(1);
  });

  it("should render the table when sponsorships exist", () => {
    renderWithRedux(<SponsorshipListPage />, { initialState: buildState() });
    expect(screen.getByTestId("mui-table")).toBeInTheDocument();
    expect(screen.getByTestId("row-1")).toBeInTheDocument();
    expect(screen.getByTestId("row-2")).toBeInTheDocument();
  });

  it("should not render the table when the list is empty", () => {
    renderWithRedux(<SponsorshipListPage />, {
      initialState: buildState({ sponsorships: [], totalSponsorships: 0 })
    });
    expect(screen.queryByTestId("mui-table")).not.toBeInTheDocument();
  });

  it("should open the dialog when the Add button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SponsorshipListPage />, { initialState: buildState() });

    expect(screen.queryByTestId("sponsorship-dialog")).not.toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByText("sponsorship_list.add_sponsorship"));
    });

    expect(screen.getByTestId("sponsorship-dialog")).toBeInTheDocument();
  });

  it("should open the dialog and fetch the entity when a row edit button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SponsorshipListPage />, { initialState: buildState() });

    await act(async () => {
      await user.click(screen.getByTestId("edit-1"));
    });

    expect(sponsorshipActions.getSponsorship).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("sponsorship-dialog")).toBeInTheDocument();
  });

  it("should close the dialog and reset form when dialog close is triggered", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SponsorshipListPage />, { initialState: buildState() });

    await act(async () => {
      await user.click(screen.getByText("sponsorship_list.add_sponsorship"));
    });

    await act(async () => {
      await user.click(screen.getByTestId("dialog-close"));
    });

    expect(sponsorshipActions.resetSponsorshipForm).toHaveBeenCalled();
    expect(screen.queryByTestId("sponsorship-dialog")).not.toBeInTheDocument();
  });

  it("should call saveSponsorship, refresh list, and close dialog when save is triggered", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SponsorshipListPage />, { initialState: buildState() });

    await act(async () => {
      await user.click(screen.getByText("sponsorship_list.add_sponsorship"));
    });

    await act(async () => {
      await user.click(screen.getByTestId("dialog-save"));
    });

    expect(sponsorshipActions.saveSponsorship).toHaveBeenCalledWith({
      id: 0,
      name: "New Tier"
    });
    expect(sponsorshipActions.getSponsorships).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId("sponsorship-dialog")).not.toBeInTheDocument();
  });

  it("should call getSponsorships with the search term when Enter is pressed", async () => {
    const user = userEvent.setup();
    renderWithRedux(<SponsorshipListPage />, { initialState: buildState() });

    const searchInput = screen.getByPlaceholderText(
      "sponsorship_list.placeholders.search"
    );

    await act(async () => {
      await user.type(searchInput, "Gold{Enter}");
    });

    expect(sponsorshipActions.getSponsorships).toHaveBeenCalledWith(
      "Gold",
      1,
      10,
      "name",
      1
    );
  });
});
