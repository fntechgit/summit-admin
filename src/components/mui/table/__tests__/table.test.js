import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import showConfirmDialog from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import Table from "..";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog",
  () => ({ __esModule: true, default: jest.fn() })
);

const ROWS = [
  { id: 1, name: "Summit One" },
  { id: 2, name: "Summit Two" }
];

const renderTable = (props) =>
  render(
    <Table
      columns={[{ columnKey: "name", header: "Name" }]}
      data={ROWS}
      totalRows={ROWS.length}
      perPage={10}
      currentPage={1}
      onPageChange={jest.fn()}
      onPerPageChange={jest.fn()}
      {...props}
    />
  );

describe("Table", () => {
  test("row click passes the clicked row", async () => {
    const onRowClick = jest.fn();
    renderTable({ onRowClick });

    await userEvent.click(screen.getByText("Summit Two"));

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(ROWS[1]);
  });

  test("action clicks do not trigger the row click", async () => {
    const onRowClick = jest.fn();
    const onSelect = jest.fn();
    renderTable({ onRowClick, onSelect, onDelete: jest.fn() });

    await userEvent.click(
      screen.getAllByRole("button", { name: "general.select" })[0]
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: "general.more_actions" })[0]
    );

    expect(onSelect).toHaveBeenCalledWith(ROWS[0]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  test("delete confirms before passing the row id", async () => {
    const onDelete = jest.fn();
    showConfirmDialog.mockResolvedValueOnce(true);
    renderTable({ onDelete });

    await userEvent.click(
      screen.getAllByRole("button", { name: "general.more_actions" })[1]
    );
    await userEvent.click(
      screen.getByRole("menuitem", { name: "general.delete" })
    );

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(2));
    expect(showConfirmDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "general.row_remove_warning Summit Two"
      })
    );
  });
});
