import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import BulkEditDataGrid from "../bulk-edit-data-grid";
import showConfirmDialog from "../showConfirmDialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../showConfirmDialog", () => jest.fn());

const columns = [
  { columnKey: "id", label: "Id", sortable: true },
  { columnKey: "title", label: "Title", sortable: true, editableField: true }
];

const data = [
  { id: 1, title: "First" },
  { id: 2, title: "Second" }
];

const renderGrid = (props = {}) =>
  render(
    <BulkEditDataGrid
      options={{ sortCol: "id", sortDir: 1 }}
      columns={columns}
      data={data}
      onSort={jest.fn()}
      onUpdate={jest.fn(() => Promise.resolve())}
      totalRows={30}
      perPage={10}
      currentPage={1}
      onPageChange={jest.fn()}
      onPerPageChange={jest.fn()}
      getName={(row) => row.title}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );

const selectRow = (rowName) =>
  userEvent.click(
    within(screen.getByRole("row", { name: new RegExp(rowName) })).getByRole(
      "checkbox"
    )
  );

describe("BulkEditDataGrid", () => {
  test("applies inline edits of the selected rows through onUpdate", async () => {
    const onUpdate = jest.fn(() => Promise.resolve());
    renderGrid({ onUpdate });

    await selectRow("Second");
    await userEvent.click(
      screen.getByRole("button", { name: "general.edit_selected (1)" })
    );

    const titleInput = screen.getByDisplayValue("Second");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Renamed");
    await userEvent.click(
      screen.getByRole("button", { name: "bulk_edit_table.apply_changes" })
    );

    expect(onUpdate).toHaveBeenCalledWith([{ id: 2, title: "Renamed" }]);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "general.edit_selected" })
      ).toBeDisabled()
    );
  });

  test("leaves edit mode when the rows shown change", async () => {
    const { rerender } = renderGrid();

    await selectRow("First");
    await userEvent.click(
      screen.getByRole("button", { name: "general.edit_selected (1)" })
    );
    expect(
      screen.getByRole("button", { name: "bulk_edit_table.apply_changes" })
    ).toBeInTheDocument();

    rerender(
      <BulkEditDataGrid
        options={{ sortCol: "id", sortDir: 1 }}
        columns={columns}
        data={[{ id: 3, title: "Third" }]}
        onSort={jest.fn()}
        onUpdate={jest.fn()}
        totalRows={30}
        perPage={10}
        currentPage={2}
      />
    );

    expect(
      screen.queryByRole("button", { name: "bulk_edit_table.apply_changes" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "general.edit_selected" })
    ).toBeDisabled();
  });

  test("column menu offers hiding a column but not managing columns", async () => {
    renderGrid();

    // the header menu button stays visually hidden until the header is
    // hovered, so find it by its aria-label rather than by role
    await userEvent.click(screen.getByLabelText("Title column menu"));

    expect(
      await screen.findByRole("menuitem", { name: /hide column/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /manage columns/i })
    ).not.toBeInTheDocument();
  });

  test("column menu of a column that can't be hidden has no empty hide section", async () => {
    renderGrid({
      columns: [
        { columnKey: "id", label: "Id", sortable: true, hideable: false },
        { columnKey: "title", label: "Title", sortable: true }
      ]
    });

    await userEvent.click(screen.getByLabelText("Id column menu"));

    // Id is the current (ascending) order, so its menu offers descending
    expect(
      await screen.findByRole("menuitem", { name: /sort by desc/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /hide column/i })
    ).not.toBeInTheDocument();
    // no divider left dangling under the sort items
    expect(
      within(screen.getByRole("menu")).queryAllByRole("separator")
    ).toHaveLength(0);
  });

  test("clicking the columns button again closes the columns panel", async () => {
    renderGrid();
    const columnsButton = screen.getByRole("button", {
      name: "Select columns"
    });

    await userEvent.click(columnsButton);
    expect(
      await screen.findByRole("checkbox", { name: "Title" })
    ).toBeInTheDocument();

    await userEvent.click(columnsButton);
    await waitFor(() =>
      expect(
        screen.queryByRole("checkbox", { name: "Title" })
      ).not.toBeInTheDocument()
    );
  });

  test("columns panel does not list the actions column", async () => {
    renderGrid({ onEdit: jest.fn() });

    await userEvent.click(
      screen.getByRole("button", { name: "Select columns" })
    );

    expect(
      await screen.findByRole("checkbox", { name: "Title" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "general.actions" })
    ).not.toBeInTheDocument();
  });

  test("unsorting goes back to the default order", async () => {
    const onSort = jest.fn();
    renderGrid({ onSort, options: { sortCol: "title", sortDir: 1 } });

    await userEvent.click(screen.getByRole("columnheader", { name: "Title" }));
    expect(onSort).toHaveBeenLastCalledWith(1, "title", -1);

    await userEvent.click(screen.getByLabelText("Title column menu"));
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /unsort/i })
    );

    expect(onSort).toHaveBeenLastCalledWith(-1, null, null);
  });

  test("both paginations page the list", async () => {
    const onPageChange = jest.fn();
    renderGrid({ onPageChange });

    const [topNext, bottomNext] = screen.getAllByRole("button", {
      name: "mui_table.next_page"
    });
    await userEvent.click(topNext);
    await userEvent.click(bottomNext);

    expect(onPageChange).toHaveBeenCalledTimes(2);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 2);
  });

  test("shows a remembered order on its column", () => {
    renderGrid({ options: { sortCol: "title", sortDir: -1 } });

    expect(screen.getByRole("columnheader", { name: "Title" })).toHaveAttribute(
      "aria-sort",
      "descending"
    );
  });

  test("reports header sorting as column index, key and direction", async () => {
    const onSort = jest.fn();
    renderGrid({ onSort });

    await userEvent.click(screen.getByRole("columnheader", { name: "Title" }));

    expect(onSort).toHaveBeenCalledWith(1, "title", 1);
  });

  test("searches only when Enter is pressed, not while typing", async () => {
    const onSearch = jest.fn();
    renderGrid({ searchProps: { term: "", onSearch } });

    await userEvent.click(
      screen.getByRole("button", { name: "general.search" })
    );
    // opening the search focuses its input
    await userEvent.keyboard("keynote");
    expect(onSearch).not.toHaveBeenCalled();

    await userEvent.keyboard("{Enter}");
    expect(onSearch).toHaveBeenCalledWith("keynote");
  });

  test("shows the search box open when a search term is applied, and collapses it when left empty", async () => {
    renderGrid({ searchProps: { term: "keynote", onSearch: jest.fn() } });

    const searchbox = screen.getByRole("textbox");
    expect(searchbox).toHaveValue("keynote");

    await userEvent.clear(searchbox);
    await userEvent.tab();

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "general.search" })
    ).toBeInTheDocument();
  });

  test("adds from the add button and lists every import option under the import icon", async () => {
    const onAdd = jest.fn();
    const onMuxImport = jest.fn();
    renderGrid({
      onAdd,
      addLabel: "add activity",
      importLabel: "import",
      importItems: [
        { label: "import from mux", onClick: onMuxImport },
        { label: "import csv", onClick: jest.fn() }
      ]
    });

    await userEvent.click(screen.getByRole("button", { name: "add activity" }));
    expect(onAdd).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "import" }));
    expect(
      screen.getByRole("menuitem", { name: "import csv" })
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("menuitem", { name: "import from mux" })
    );
    expect(onMuxImport).toHaveBeenCalledTimes(1);
  });

  const clickDelete = (rowName) =>
    userEvent.click(
      within(screen.getByRole("row", { name: new RegExp(rowName) })).getByRole(
        "menuitem",
        { name: "general.delete" }
      )
    );

  test("deletes a row after the confirm dialog is accepted", async () => {
    const onDelete = jest.fn();
    showConfirmDialog.mockResolvedValueOnce(true);
    renderGrid({ onDelete, deleteDialogBody: (name) => `delete ${name}?` });

    await clickDelete("First");

    expect(showConfirmDialog).toHaveBeenCalledWith(
      expect.objectContaining({ text: "delete First?" })
    );
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1));
  });

  test("keeps the row when the confirm dialog is cancelled", async () => {
    const onDelete = jest.fn();
    showConfirmDialog.mockResolvedValueOnce(false);
    renderGrid({ onDelete });

    await clickDelete("First");

    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
    expect(onDelete).not.toHaveBeenCalled();
  });
});
