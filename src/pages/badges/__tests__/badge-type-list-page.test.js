import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import BadgeTypeListPage from "../badge-type-list-page";
import { getBadgeTypes, deleteBadgeType } from "../../../actions/badge-actions";

jest.mock("../../../actions/badge-actions", () => ({
  getBadgeTypes: jest.fn(),
  deleteBadgeType: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, onDelete, onSort }) => (
    <div>
      <button type="button" onClick={() => onDelete(data[0].id)}>
        delete-row
      </button>
      <button type="button" onClick={() => onSort("name", -1)}>
        sort-col
      </button>
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const initialState = {
  currentSummitState: { currentSummit: createMockSummit() },
  currentBadgeTypeListState: {
    badgeTypes: [{ id: 7, name: "Attendee", is_default: true }],
    totalBadgeTypes: 1,
    order: "name",
    orderDir: 1
  }
};

describe("BadgeTypeListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getBadgeTypes.mockReturnValue(() => Promise.resolve());
    deleteBadgeType.mockReturnValue(() => Promise.resolve());
  });

  it("fetches on mount and refetches with the selected sort", async () => {
    renderWithRedux(<BadgeTypeListPage />, { initialState });

    expect(getBadgeTypes).toHaveBeenCalledTimes(1);
    expect(getBadgeTypes).toHaveBeenCalledWith();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "sort-col" }));
    });

    expect(getBadgeTypes).toHaveBeenCalledTimes(2);
    expect(getBadgeTypes).toHaveBeenLastCalledWith("name", -1);
  });

  it("deletes the confirmed row by id (confirm is handled inside MuiTable)", async () => {
    renderWithRedux(<BadgeTypeListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
    });

    expect(deleteBadgeType).toHaveBeenCalledTimes(1);
    expect(deleteBadgeType).toHaveBeenCalledWith(7);
  });
});
