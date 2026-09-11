import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import SummitDocListPage from "../summitdoc-list-page";
import {
  getSummitDocs,
  deleteSummitDoc
} from "../../../actions/summitdoc-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

jest.mock("../../../actions/summitdoc-actions", () => ({
  getSummitDocs: jest.fn(),
  deleteSummitDoc: jest.fn()
}));

let capturedColumns;

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({
    onEdit,
    onDelete,
    onSort,
    onPageChange,
    onPerPageChange,
    columns
  }) => {
    capturedColumns = columns;
    return (
      <div>
        <button
          type="button"
          onClick={() => onEdit({ id: 1, label: "test-label" })}
        >
          edit-row
        </button>
        <button type="button" onClick={() => onDelete(1)}>
          delete-row
        </button>
        <button type="button" onClick={() => onSort("label", -1)}>
          sort-col
        </button>
        <button type="button" onClick={() => onPageChange(2)}>
          page-2
        </button>
        <button type="button" onClick={() => onPerPageChange(50)}>
          perpage-50
        </button>
      </div>
    );
  }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <button type="button" onClick={() => onSearch("newterm")}>
        search-trigger
      </button>
    )
  })
);

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { push: jest.fn() };

const initialState = {
  currentSummitState: { currentSummit: createMockSummit() },
  summitDocListState: {
    summitDocs: [
      {
        id: 1,
        name: "test-doc",
        label: "test-label",
        description: "test-description",
        event_types_string: "Keynote, Panel"
      }
    ],
    totalSummitDocs: 1,
    perPage: 10,
    currentPage: 1,
    term: "",
    order: "id",
    orderDir: 1,
    lastPage: 1
  }
};

describe("SummitDocListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSummitDocs.mockReturnValue(() => Promise.resolve());
    deleteSummitDoc.mockReturnValue(() => Promise.resolve());
  });

  it("bounds the description and event types column widths and wraps long content", () => {
    renderWithRedux(<SummitDocListPage history={mockHistory} />, {
      initialState
    });

    const descriptionColumn = capturedColumns.find(
      (c) => c.columnKey === "description"
    );
    const eventTypesColumn = capturedColumns.find(
      (c) => c.columnKey === "event_types_string"
    );
    expect(descriptionColumn.width).toBe(400);
    expect(eventTypesColumn.width).toBe(300);

    const longValue = "lorem ipsum ".repeat(50).trim();
    const { container } = render(
      descriptionColumn.render({ description: longValue })
    );

    expect(container.firstChild).toHaveStyle({
      wordBreak: "break-word",
      overflowWrap: "anywhere"
    });
    expect(container).toHaveTextContent(longValue);
  });

  it("deletes the summit doc by id (confirm is handled inside MuiTable)", async () => {
    renderWithRedux(<SummitDocListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
    });

    expect(deleteSummitDoc).toHaveBeenCalledWith(1);
  });

  it("resets to the first page on search", async () => {
    renderWithRedux(<SummitDocListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "search-trigger" })
      );
    });

    expect(getSummitDocs).toHaveBeenLastCalledWith(
      "newterm",
      DEFAULT_CURRENT_PAGE,
      10,
      "id",
      1
    );
  });

  it("resets to the first page on per-page change", async () => {
    renderWithRedux(<SummitDocListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "perpage-50" }));
    });

    expect(getSummitDocs).toHaveBeenLastCalledWith(
      "",
      DEFAULT_CURRENT_PAGE,
      50,
      "id",
      1
    );
  });

  it("keeps the current page on sort", async () => {
    renderWithRedux(<SummitDocListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "sort-col" }));
    });

    expect(getSummitDocs).toHaveBeenLastCalledWith("", 1, 10, "label", -1);
  });

  it("navigates to the edit page", async () => {
    renderWithRedux(<SummitDocListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
    });

    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/456/summitdocs/1"
    );
  });

  it("navigates to the add page", async () => {
    renderWithRedux(<SummitDocListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "summitdoc.add" })
      );
    });

    expect(mockHistory.push).toHaveBeenCalledWith(
      "/app/summits/456/summitdocs/new"
    );
  });
});
