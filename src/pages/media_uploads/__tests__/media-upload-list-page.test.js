import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import MediaUploadListPage from "../media-upload-list-page";
import {
  getMediaUploads,
  getMediaUpload,
  deleteMediaUpload,
  copyMediaUploads,
  resetMediaUploadForm,
  saveMediaUpload
} from "../../../actions/media-upload-actions";
import { getAllMediaFileTypes } from "../../../actions/media-file-type-actions";

jest.mock("../../../actions/media-upload-actions", () => ({
  getMediaUploads: jest.fn(),
  getMediaUpload: jest.fn(),
  deleteMediaUpload: jest.fn(),
  copyMediaUploads: jest.fn(),
  resetMediaUploadForm: jest.fn(),
  saveMediaUpload: jest.fn()
}));

jest.mock("../../../actions/media-file-type-actions", () => ({
  getAllMediaFileTypes: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete, onSort, onPageChange, onPerPageChange }) => (
    <div data-testid="mui-table">
      <button type="button" onClick={() => onEdit({ id: 7 })}>
        edit-row
      </button>
      <button type="button" onClick={() => onDelete(7)}>
        delete-row
      </button>
      <button type="button" onClick={() => onSort("name", 0)}>
        sort-name
      </button>
      <button type="button" onClick={() => onPageChange(2)}>
        page-2
      </button>
      <button type="button" onClick={() => onPerPageChange(20)}>
        per-page-20
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <button type="button" onClick={() => onSearch("foo")}>
        search-foo
      </button>
    )
  })
);

jest.mock("../../../components/summit-dropdown", () => ({
  __esModule: true,
  default: ({ onClick }) => (
    <button type="button" onClick={() => onClick(99)}>
      copy-media-uploads
    </button>
  )
}));

// The stub mirrors the real popup contract from the popup-dialog pattern:
// it closes only when the promise returned by onSave resolves.
jest.mock("../components/media-upload-dialog", () => ({
  __esModule: true,
  default: ({ onSave, onClose }) => (
    <div data-testid="media-upload-dialog">
      <button
        type="button"
        onClick={() =>
          onSave({ id: 7 })
            .then(() => onClose())
            .catch(() => {})
        }
      >
        popup-save
      </button>
      <button type="button" onClick={onClose}>
        popup-close
      </button>
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const initialState = {
  currentSummitState: {
    currentSummit: { id: 42 }
  },
  mediaUploadListState: {
    media_uploads: [{ id: 7, name: "Slides", description: "Slides upload" }],
    totalMediaUploads: 1,
    perPage: 10,
    currentPage: 3,
    term: "",
    order: "id",
    orderDir: 1
  },
  mediaUploadState: {
    entity: { id: 0, name: "", description: "" },
    errors: {},
    media_file_types: []
  }
};

describe("MediaUploadListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMediaUploads.mockReturnValue(() => Promise.resolve());
    getMediaUpload.mockReturnValue(() => Promise.resolve());
    deleteMediaUpload.mockReturnValue(() => Promise.resolve());
    saveMediaUpload.mockReturnValue(() => Promise.resolve());
    copyMediaUploads.mockReturnValue(() => Promise.resolve());
    resetMediaUploadForm.mockReturnValue({ type: "RESET_MEDIA_UPLOAD_FORM" });
    getAllMediaFileTypes.mockReturnValue(() => Promise.resolve());
  });

  it("fetches media uploads and media file types on mount", () => {
    renderWithRedux(<MediaUploadListPage />, { initialState });

    expect(getMediaUploads).toHaveBeenCalledTimes(1);
    expect(getAllMediaFileTypes).toHaveBeenCalledTimes(1);
  });

  it("threads search, pagination and sort params to getMediaUploads", async () => {
    renderWithRedux(<MediaUploadListPage />, { initialState });

    await userEvent.click(screen.getByRole("button", { name: "search-foo" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("foo", 1, 10, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "page-2" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("", 2, 10, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "per-page-20" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("", 1, 20, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "sort-name" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("", 1, 10, "name", 0);
  });

  it("fetches the entity and opens the dialog when clicking edit", async () => {
    renderWithRedux(<MediaUploadListPage />, { initialState });

    expect(screen.queryByTestId("media-upload-dialog")).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    expect(getMediaUpload).toHaveBeenCalledWith(7);
    expect(screen.getByTestId("media-upload-dialog")).toBeInTheDocument();
  });

  it("reloads the list at the current page after a successful edit", async () => {
    renderWithRedux(<MediaUploadListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "popup-save" }));
      await flushPromises();
    });

    expect(saveMediaUpload).toHaveBeenCalledWith({ id: 7 });
    // Call 1: useEffect on mount; call 2: handleSave refresh
    expect(getMediaUploads).toHaveBeenCalledTimes(2);
    // Editing an existing entity (has id) stays on the current page (3)
    // instead of bouncing back to the default page.
    expect(getMediaUploads).toHaveBeenLastCalledWith("", 3, 10, "id", 1);
  });

  it("closes the dialog on save success even if the list refresh fails", async () => {
    getMediaUploads
      .mockReturnValueOnce(() => Promise.resolve()) // mount fetch
      .mockReturnValue(() => Promise.reject(new Error("refresh failed")));

    renderWithRedux(<MediaUploadListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "popup-save" }));
      await flushPromises();
    });

    expect(saveMediaUpload).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("media-upload-dialog")).not.toBeInTheDocument();
  });

  it("reloads the list after a successful delete", async () => {
    renderWithRedux(<MediaUploadListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    expect(deleteMediaUpload).toHaveBeenCalledWith(7);
    // Call 1: useEffect on mount; call 2: handleDelete refresh
    expect(getMediaUploads).toHaveBeenCalledTimes(2);
  });

  it("copies media uploads from the selected summit", async () => {
    renderWithRedux(<MediaUploadListPage />, { initialState });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "copy-media-uploads" })
      );
      await flushPromises();
    });

    expect(copyMediaUploads).toHaveBeenCalledWith(99);
  });

  it("resets the form when opening the add dialog and unmounts it on close", async () => {
    renderWithRedux(<MediaUploadListPage />, { initialState });

    await userEvent.click(
      screen.getByRole("button", { name: "media_upload.add" })
    );

    expect(resetMediaUploadForm).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("media-upload-dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "popup-close" }));

    expect(screen.queryByTestId("media-upload-dialog")).not.toBeInTheDocument();
  });
});
