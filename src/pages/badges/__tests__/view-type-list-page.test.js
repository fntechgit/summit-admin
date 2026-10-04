import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import ViewTypeListPage from "../view-type-list-page";
import { getViewTypes, deleteViewType } from "../../../actions/badge-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

jest.mock("../../../actions/badge-actions", () => ({
  getViewTypes: jest.fn(),
  deleteViewType: jest.fn()
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

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <button type="button" onClick={() => onSearch("speak")}>
        search
      </button>
    )
  })
);

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// non-default page/perPage so a missing reset to the first page is observable
const initialState = {
  currentSummitState: { currentSummit: createMockSummit() },
  currentViewTypeListState: {
    viewTypes: [{ id: 7, name: "Attendee", is_default: true }],
    totalViewTypes: 1,
    term: "att",
    order: "name",
    orderDir: 1,
    currentPage: 3,
    perPage: 20
  }
};

const click = (name) =>
  act(async () => {
    await userEvent.click(screen.getByRole("button", { name }));
  });

describe("ViewTypeListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getViewTypes.mockReturnValue(() => Promise.resolve());
    deleteViewType.mockReturnValue(() => Promise.resolve());
  });

  it("fetches on mount and refetches from the first page on search and sort", async () => {
    renderWithRedux(<ViewTypeListPage />, { initialState });

    expect(getViewTypes).toHaveBeenCalledWith();

    await click("search");
    expect(getViewTypes).toHaveBeenLastCalledWith(
      "speak",
      DEFAULT_CURRENT_PAGE,
      20,
      "name",
      1
    );

    await click("sort-col");
    expect(getViewTypes).toHaveBeenLastCalledWith(
      "att",
      DEFAULT_CURRENT_PAGE,
      20,
      "name",
      -1
    );
  });

  it("refetches from the first page after a delete, but not when the delete fails", async () => {
    renderWithRedux(<ViewTypeListPage />, { initialState });

    getViewTypes.mockClear();
    deleteViewType.mockReturnValueOnce(() => Promise.reject(new Error("boom")));
    await click("delete-row");
    await flushPromises();

    expect(deleteViewType).toHaveBeenCalledWith(7);
    expect(getViewTypes).not.toHaveBeenCalled();

    await click("delete-row");
    await flushPromises();

    expect(getViewTypes).toHaveBeenCalledTimes(1);
    expect(getViewTypes).toHaveBeenCalledWith(
      "att",
      DEFAULT_CURRENT_PAGE,
      20,
      "name",
      1
    );
  });
});
