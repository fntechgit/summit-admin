// ---- Mocks must come first ----

// i18n translate: echo the key
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Confirm dialog (exported mock we can control)
jest.mock("../components/showConfirmDialog", () => {
  const mockShowConfirmDialog = jest.fn();
  return { __esModule: true, default: mockShowConfirmDialog };
});

// Avoid MUI ripple noise
jest.mock("@mui/material/IconButton", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children, onClick, ...rest }) => (
      <button type="button" onClick={onClick} {...rest}>
        {children}
      </button>
    )
  };
});
jest.mock("@mui/material/ButtonBase/TouchRipple", () => ({ __esModule: true, default: () => null }));

// TablePagination shim
jest.mock("@mui/material/TablePagination", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function TablePaginationMock(props) {
      const {
        count,
        rowsPerPage,
        page,
        rowsPerPageOptions,
        onPageChange,
        onRowsPerPageChange,
        labelRowsPerPage
      } = props;

      return (
        <div data-testid="pagination">
          <div>count:{count}</div>
          <div>rowsPerPage:{rowsPerPage}</div>
          <div>page:{page}</div>
          <div>label:{labelRowsPerPage}</div>
          <div>
            options:{rowsPerPageOptions && rowsPerPageOptions.join(",")}
          </div>
          <button
            onClick={() => onPageChange({}, page + 1)}
            aria-label="next-page"
          >
            next
          </button>
          <button
            onClick={() =>
              onRowsPerPageChange({
                target: { value: rowsPerPageOptions?.[0] ?? 10 }
              })
            }
            aria-label="change-rows"
          >
            change-rows
          </button>
        </div>
      );
    }
  };
});

// TableSortLabel shim -> renders an actual <button>
jest.mock("@mui/material/TableSortLabel", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function TableSortLabelMock({
      children,
      onClick,
      active,
      direction
    }) {
      return (
        <button
          type="button"
          data-testid={`sort-label-${direction}-${
            active ? "active" : "inactive"
          }`}
          onClick={onClick}
        >
          {children}
        </button>
      );
    }
  };
});

// ---- Now imports ----
/* eslint-disable import/first */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MuiTableEditable from "../editable-table/mui-table-editable";
import showConfirmDialog from "../components/showConfirmDialog";
/* eslint-enable import/first */

afterEach(() => {
  jest.clearAllMocks();
});

// ---- Helpers ----
const columns = [
  { columnKey: "name", header: "Name", sortable: true, editable: true },
  { columnKey: "role", header: "Role", sortable: false, editable: false },
  {
    columnKey: "age",
    header: "Age",
    sortable: true,
    editable: true,
    width: 100
  }
];

const data = [
  { id: 1, name: "Alice", role: "Dev", age: 35 },
  { id: 2, name: "Bob", role: "PM", age: 41 }
];

const setup = (overrides = {}) => {
  const props = {
    columns,
    data,
    totalRows: 2,
    perPage: 10,
    currentPage: 1,
    onPageChange: jest.fn(),
    onPerPageChange: jest.fn(),
    onSort: jest.fn(),
    options: { sortCol: "name", sortDir: "-1" },
    getName: (item) => item.name,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onCellChange: jest.fn(),
    ...overrides
  };
  render(<MuiTableEditable {...props} />);
  return props;
};

// ---- Tests ----
describe("MuiTableEditable", () => {
  test("renders headers and rows", () => {
    setup();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("click editable cell -> edit, blur -> onCellChange", async () => {
    const user = userEvent.setup();
    const { onCellChange } = setup();

    const aliceNameCell = screen.getByText("Alice").closest("td");
    await user.click(aliceNameCell);

    const input = screen.getByDisplayValue("Alice");
    await user.clear(input);
    await user.type(input, "Alicia");
    input.blur();

    expect(onCellChange).toHaveBeenCalledWith(1, "name", "Alicia");
  });

  test("press Enter commits edit", async () => {
    const user = userEvent.setup();
    const { onCellChange } = setup();

    const bobAgeCell = screen.getByText("41").closest("td");
    await user.click(bobAgeCell);
    const input = screen.getByDisplayValue("41");
    await user.clear(input);
    await user.type(input, "42{enter}");

    expect(onCellChange).toHaveBeenCalledWith(2, "age", "42");
  });

  test("non-editable cell does not enter edit mode", async () => {
    const user = userEvent.setup();
    setup();
    const roleCell = screen.getAllByText("Dev")[0].closest("td");
    await user.click(roleCell);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  test("edit button calls onEdit", async () => {
    const user = userEvent.setup();
    const { onEdit } = setup();
    const [btn] = screen.getAllByLabelText("general.edit");
    await user.click(btn);
    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: "Alice" })
    );
  });

  test("delete confirmed calls onDelete", async () => {
    const user = userEvent.setup();
    const { onDelete } = setup();
    showConfirmDialog.mockResolvedValueOnce(true); // ✅ use the exported mock
    const [btn] = screen.getAllByLabelText("general.delete");
    await user.click(btn);
    expect(showConfirmDialog).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  test("delete canceled does not call onDelete", async () => {
    const user = userEvent.setup();
    const { onDelete } = setup();
    showConfirmDialog.mockResolvedValueOnce(false);
    const [btn] = screen.getAllByLabelText("general.delete");
    await user.click(btn);
    expect(showConfirmDialog).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("pagination next -> onPageChange(2) when starting at page 1", async () => {
    const user = userEvent.setup();
    const { onPageChange } = setup({ currentPage: 1 });
    const next = within(screen.getByTestId("pagination")).getByRole("button", {
      name: "next-page"
    });
    await user.click(next);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("change rows per page triggers onPerPageChange", async () => {
    const user = userEvent.setup();
    const { onPerPageChange } = setup({ perPage: 25 });
    const change = within(screen.getByTestId("pagination")).getByRole(
      "button",
      { name: "change-rows" }
    );
    await user.click(change);
    expect(onPerPageChange).toHaveBeenCalledWith(expect.any(Number));
  });

  test("uses totalRows when provided", () => {
    setup({ totalRows: 123 });
    expect(
      within(screen.getByTestId("pagination")).getByText("count:123")
    ).toBeInTheDocument();
  });

  test("falls back to data.length when totalRows missing", () => {
    setup({ totalRows: undefined, data: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    expect(
      within(screen.getByTestId("pagination")).getByText("count:3")
    ).toBeInTheDocument();
  });

  test("sort click triggers onSort with flipped dir", async () => {
    const user = userEvent.setup();
    const { onSort } = setup({ options: { sortCol: "name", sortDir: "-1" } });

    // 1) Try our mock's testid first (desc + active when sortDir === "-1")
    let sortBtn = screen.queryByTestId("sort-label-desc-active");

    // 2) Fallback: any sort-label button whose text includes "Name"
    if (!sortBtn) {
      const candidates = screen.queryAllByTestId(/sort-label-/i);
      sortBtn =
        candidates.find(
          (el) => el.textContent && el.textContent.trim().includes("Name")
        ) || null;
    }

    // 3) Last resort: just click the element that renders "Name"
    // (in our mock, the button itself contains the text "Name")
    if (!sortBtn) {
      sortBtn = screen.getByText(/^Name$/);
    }

    await user.click(sortBtn);

    expect(onSort).toHaveBeenCalled();
    const [colKey, newDir] = onSort.mock.calls[0];
    expect(colKey).toBe("name");
    expect(newDir).toBe(1); // "-1" * -1 => 1
  });
});
