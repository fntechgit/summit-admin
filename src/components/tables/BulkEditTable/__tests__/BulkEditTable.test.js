import React from "react";
import userEvent from "@testing-library/user-event";
import { act, render, screen, waitFor } from "@testing-library/react";
import BulkEditTable from "../BulkEditTable";

describe("BulkEditTable", () => {
  const baseProps = {
    options: {
      className: "test-table",
      actions: {}
    },
    columns: [
      { columnKey: "id", value: "id", sortable: true },
      { columnKey: "title", value: "title", sortable: true }
    ],
    onSort: jest.fn(),
    data: [
      { id: 1, title: "Event 1" },
      { id: 2, title: "Event 2" }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("applies bulk updates to selected rows", async () => {
    const user = userEvent.setup();
    const onUpdate = jest.fn(() => Promise.resolve());

    render(<BulkEditTable {...baseProps} onUpdate={onUpdate} />);

    const checkboxes = screen.getAllByRole("checkbox");

    await user.click(checkboxes[1]);
    await user.click(screen.getByText("event_list.edit_selected"));
    await act(async () => {
      await user.click(screen.getByText("bulk_actions_page.btn_apply_changes"));
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 1 })])
      );
    });
  });
});
