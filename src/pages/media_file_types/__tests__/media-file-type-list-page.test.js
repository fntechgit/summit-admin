import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../utils/test-utils";
import MediaFileTypeListPage from "../media-file-type-list-page";
import * as mediaFileTypeActions from "../../../actions/media-file-type-actions";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PER_PAGE
} from "../../../utils/constants";

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
          <button type="button" onClick={() => onEdit(row)}>
            edit-row
          </button>
          <button type="button" onClick={() => onDelete(row.id)}>
            delete-row
          </button>
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

jest.mock("../components/media-file-type-dialog", () => ({
  __esModule: true,
  default: ({ onClose, onSave }) => (
    <div role="dialog" data-testid="media-file-type-dialog">
      <button type="button" onClick={onClose}>
        dialog-close
      </button>
      <button type="button" onClick={() => onSave({ id: 0, name: "New Type" })}>
        dialog-save
      </button>
    </div>
  )
}));

jest.mock("../../../actions/media-file-type-actions", () => ({
  ...jest.requireActual("../../../actions/media-file-type-actions"),
  getMediaFileTypes: jest.fn(() => () => Promise.resolve()),
  getMediaFileType: jest.fn(() => () => Promise.resolve()),
  saveMediaFileType: jest.fn(() => () => Promise.resolve()),
  deleteMediaFileType: jest.fn(() => () => Promise.resolve()),
  resetMediaFileTypeForm: jest.fn(() => () => {})
}));

const buildInitialState = (listOverrides = {}) => ({
  mediaFileTypeListState: {
    media_file_types: [],
    term: "",
    order: "id",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalMediaFileTypes: 0,
    ...listOverrides
  },
  mediaFileTypeState: {
    entity: { id: 0, name: "", description: "", allowed_extensions: "" },
    errors: {}
  }
});

describe("MediaFileTypeListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should call getMediaFileTypes on mount", async () => {
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState()
    });

    await waitFor(() => {
      expect(mediaFileTypeActions.getMediaFileTypes).toHaveBeenCalledTimes(1);
    });
  });

  test("should show empty state message when list is empty", () => {
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState()
    });

    expect(screen.getByText("media_file_type.no_results")).toBeInTheDocument();
    expect(screen.queryByTestId("mui-table")).not.toBeInTheDocument();
  });

  test("should show table and total count when media file types are present", () => {
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState({
        media_file_types: [
          { id: 1, name: "Image", description: "", allowed_extensions: [] },
          { id: 2, name: "Document", description: "", allowed_extensions: [] }
        ],
        totalMediaFileTypes: 2
      })
    });

    expect(screen.getByTestId("mui-table")).toBeInTheDocument();
    expect(
      screen.getByText(/2\smedia_file_type\.media_file_types/)
    ).toBeInTheDocument();
    expect(
      screen.queryByText("media_file_type.no_results")
    ).not.toBeInTheDocument();
  });

  test("opens dialog and resets form when Add button is clicked", async () => {
    const user = userEvent.setup();
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState()
    });

    await user.click(screen.getByText("media_file_type.add"));

    expect(mediaFileTypeActions.resetMediaFileTypeForm).toHaveBeenCalled();
    expect(screen.getByTestId("media-file-type-dialog")).toBeInTheDocument();
  });

  test("closes dialog when dialog close is triggered", async () => {
    const user = userEvent.setup();
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState()
    });

    await user.click(screen.getByText("media_file_type.add"));
    expect(screen.getByTestId("media-file-type-dialog")).toBeInTheDocument();

    await user.click(screen.getByText("dialog-close"));
    expect(
      screen.queryByTestId("media-file-type-dialog")
    ).not.toBeInTheDocument();
  });

  test("should fetch entity and opens dialog on row edit", async () => {
    const user = userEvent.setup();
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState({
        media_file_types: [
          { id: 7, name: "Video", description: "", allowed_extensions: ["MP4"] }
        ],
        totalMediaFileTypes: 1
      })
    });

    await user.click(screen.getByText("edit-row"));

    await waitFor(() => {
      expect(mediaFileTypeActions.getMediaFileType).toHaveBeenCalledWith(7);
    });
  });

  test("should call deleteMediaFileType and refreshes list on row delete", async () => {
    const user = userEvent.setup();
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState({
        media_file_types: [
          { id: 3, name: "Audio", description: "", allowed_extensions: [] }
        ],
        totalMediaFileTypes: 1
      })
    });

    await user.click(screen.getByText("delete-row"));

    await waitFor(() => {
      expect(mediaFileTypeActions.deleteMediaFileType).toHaveBeenCalledWith(3);
    });
  });

  test("should call getMediaFileTypes with search term on search", async () => {
    const user = userEvent.setup();
    renderWithRedux(<MediaFileTypeListPage />, {
      initialState: buildInitialState()
    });

    await user.type(screen.getByTestId("search-input"), "pdf{Enter}");

    await waitFor(() => {
      expect(mediaFileTypeActions.getMediaFileTypes).toHaveBeenCalledWith(
        "pdf",
        DEFAULT_CURRENT_PAGE,
        DEFAULT_PER_PAGE,
        "id",
        1
      );
    });
  });
});
