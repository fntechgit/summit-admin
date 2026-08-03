import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import MediaUploadListPage from "../media-upload-list-page";
import {
  getMediaUploads,
  deleteMediaUpload,
  copyMediaUploads
} from "../../../actions/media-upload-actions";

jest.mock("../../../actions/media-upload-actions", () => ({
  getMediaUploads: jest.fn(),
  deleteMediaUpload: jest.fn(),
  copyMediaUploads: jest.fn()
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
  }
};

describe("MediaUploadListPage", () => {
  let history;

  beforeEach(() => {
    jest.clearAllMocks();
    history = { push: jest.fn() };
    getMediaUploads.mockReturnValue(() => Promise.resolve());
    deleteMediaUpload.mockReturnValue(() => Promise.resolve());
    copyMediaUploads.mockReturnValue(() => Promise.resolve());
  });

  const renderPage = () =>
    renderWithRedux(<MediaUploadListPage history={history} />, {
      initialState
    });

  it("fetches media uploads on mount", () => {
    renderPage();

    expect(getMediaUploads).toHaveBeenCalledTimes(1);
  });

  it("threads search, pagination and sort params to getMediaUploads", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "search-foo" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("foo", 1, 10, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "page-2" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("", 2, 10, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "per-page-20" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("", 1, 20, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "sort-name" }));
    expect(getMediaUploads).toHaveBeenLastCalledWith("", 1, 10, "name", 0);
  });

  it("navigates to the edit route when clicking edit", async () => {
    renderPage();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    expect(history.push).toHaveBeenCalledWith(
      "/app/summits/42/media-uploads/7"
    );
  });

  it("navigates to the new route when clicking add", async () => {
    renderPage();

    await userEvent.click(
      screen.getByRole("button", { name: "media_upload.add" })
    );

    expect(history.push).toHaveBeenCalledWith(
      "/app/summits/42/media-uploads/new"
    );
  });

  it("reloads the list after a successful delete", async () => {
    renderPage();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    expect(deleteMediaUpload).toHaveBeenCalledWith(7);
    // Call 1: useEffect on mount; call 2: handleDelete refresh
    expect(getMediaUploads).toHaveBeenCalledTimes(2);
  });

  it("copies media uploads from the selected summit", async () => {
    renderPage();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "copy-media-uploads" })
      );
      await flushPromises();
    });

    expect(copyMediaUploads).toHaveBeenCalledWith(99);
  });
});
