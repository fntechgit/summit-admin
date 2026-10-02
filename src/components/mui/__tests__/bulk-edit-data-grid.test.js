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
      screen.getByRole("button", { name: "general.apply_changes" })
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
      screen.getByRole("button", { name: "general.apply_changes" })
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
      screen.queryByRole("button", { name: "general.apply_changes" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "general.edit_selected" })
    ).toBeDisabled();
  });

  test("reports 1-based pages to onPageChange", async () => {
    const onPageChange = jest.fn();
    renderGrid({ onPageChange });

    await userEvent.click(
      screen.getByRole("button", { name: /go to next page/i })
    );

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test("does not mark the default order as a user sort", () => {
    renderGrid({ options: { sortCol: "id", sortDir: 1 } });

    expect(screen.getByRole("columnheader", { name: "Id" })).toHaveAttribute(
      "aria-sort",
      "none"
    );
  });

  test("reports header sorting as column index, key and direction", async () => {
    const onSort = jest.fn();
    renderGrid({ onSort });

    await userEvent.click(screen.getByRole("columnheader", { name: "Title" }));

    expect(onSort).toHaveBeenCalledWith(1, "title", 1);
  });

  test("sends the quick filter text to onSearch", async () => {
    const onSearch = jest.fn();
    renderGrid({ searchProps: { term: "", onSearch } });

    await userEvent.type(screen.getByRole("searchbox"), "keynote");

    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("keynote"));
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
