import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import TagListPage from "../tag-list-page";
import {
  getTags,
  deleteTag,
  saveTag,
  resetTagForm
} from "../../../actions/tag-actions";

jest.mock("../../../actions/tag-actions", () => ({
  getTags: jest.fn(),
  deleteTag: jest.fn(),
  saveTag: jest.fn(),
  resetTagForm: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete, onSort, onPageChange, onPerPageChange }) => (
    <div>
      <button
        type="button"
        onClick={() => onEdit({ id: 1, tag: "existing-tag" })}
      >
        edit-row
      </button>
      <button type="button" onClick={() => onDelete(1)}>
        delete-row
      </button>
      <button type="button" onClick={() => onSort("tag", 1)}>
        sort-col
      </button>
      <button type="button" onClick={() => onPageChange(2)}>
        page-change
      </button>
      <button type="button" onClick={() => onPerPageChange(25)}>
        per-page-change
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: () => <input placeholder="search-tags" />
  })
);

jest.mock("../tags-popup", () => ({
  __esModule: true,
  default: ({ onSave, onClose }) => (
    <div data-testid="tags-dialog">
      <button type="button" onClick={() => onSave({ tag: "new-tag" })}>
        dialog-save
      </button>
      <button type="button" onClick={onClose}>
        dialog-close
      </button>
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const initialState = {
  currentTagListState: {
    tags: [
      {
        id: 1,
        tag: "existing-tag",
        created: "2024-01-01",
        updated: "2024-01-01"
      }
    ],
    totalTags: 1,
    perPage: 10,
    currentPage: 1,
    term: "",
    order: "id",
    orderDir: 1
  },
  currentSummitState: {
    currentSummit: { id: 1 }
  }
};

describe("TagListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTags.mockReturnValue(() => Promise.resolve());
    deleteTag.mockReturnValue(() => Promise.resolve());
    saveTag.mockReturnValue(() => Promise.resolve());
    resetTagForm.mockReturnValue({ type: "RESET_TAG_FORM" });
  });

  it("reloads the list after a successful save", async () => {
    renderWithRedux(<TagListPage />, { initialState });

    // Open the dialog (conditional mount)
    await userEvent.click(
      screen.getByRole("button", { name: "tag_list.add_tag" })
    );
    expect(screen.getByTestId("tags-dialog")).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "dialog-save" })
      );
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleSaveTag .then()
    expect(getTags).toHaveBeenCalledTimes(2);
  });

  it("reloads the list after a successful delete", async () => {
    renderWithRedux(<TagListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDeleteTag .then()
    expect(getTags).toHaveBeenCalledTimes(2);
  });

  it("re-syncs the list after a failed delete", async () => {
    deleteTag.mockReturnValue(() => Promise.reject(new Error("delete failed")));

    renderWithRedux(<TagListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDeleteTag .catch()
    expect(getTags).toHaveBeenCalledTimes(2);
  });

  it("calls getTags with updated sort params on sort change", async () => {
    renderWithRedux(<TagListPage />, { initialState });

    await userEvent.click(screen.getByRole("button", { name: "sort-col" }));

    // Call 1: useEffect on mount; call 2: onSort
    expect(getTags).toHaveBeenCalledTimes(2);
    expect(getTags).toHaveBeenLastCalledWith("", 1, 10, "tag", 1);
  });

  it("calls getTags with the new page on page change", async () => {
    renderWithRedux(<TagListPage />, { initialState });

    await userEvent.click(screen.getByRole("button", { name: "page-change" }));

    // Call 1: useEffect on mount; call 2: onPageChange
    expect(getTags).toHaveBeenCalledTimes(2);
    expect(getTags).toHaveBeenLastCalledWith("", 2, 10, "id", 1);
  });

  it("resets to page 1 on per-page change", async () => {
    renderWithRedux(<TagListPage />, { initialState });

    await userEvent.click(
      screen.getByRole("button", { name: "per-page-change" })
    );

    // Call 1: useEffect on mount; call 2: onPerPageChange
    expect(getTags).toHaveBeenCalledTimes(2);
    expect(getTags).toHaveBeenLastCalledWith("", 1, 25, "id", 1);
  });

  it("calls resetTagForm when dialog is closed without saving", async () => {
    renderWithRedux(<TagListPage />, { initialState });

    await userEvent.click(
      screen.getByRole("button", { name: "tag_list.add_tag" })
    );
    expect(screen.getByTestId("tags-dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "dialog-close" }));

    expect(resetTagForm).toHaveBeenCalled();
  });
});
