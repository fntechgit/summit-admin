import React from "react";
import userEvent from "@testing-library/user-event";
import { act, render, screen, waitFor } from "@testing-library/react";
import EditableTable from "../EditableTable";

describe("EditableTable", () => {
  const baseProps = {
    options: {
      className: "test-table",
      actions: {}
    },
    columns: [
      { columnKey: "id", value: "id", sortable: true },
      { columnKey: "title", value: "title", sortable: true }
    ],
    currentSummit: { id: 99 },
    page: 1,
    handleSort: jest.fn(),
    handleDeleteRow: jest.fn(),
    formattingFunction: (row) => row,
    data: [
      {
        id: 1,
        title: "Event 1",
        media_uploads: [{ id: 11, event_id: 1 }]
      },
      {
        id: 2,
        title: "Event 2",
        media_uploads: [{ id: 22, event_id: 2 }]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("applies bulk updates without executing afterUpdate by default", async () => {
    const user = userEvent.setup();
    const updateData = jest.fn(() => Promise.resolve());

    render(<EditableTable {...baseProps} updateData={updateData} />);

    const checkboxes = screen.getAllByRole("checkbox");

    await user.click(checkboxes[1]);
    await user.click(screen.getByText("event_list.edit_selected"));
    await act(async () => {
      await user.click(screen.getByText("bulk_actions_page.btn_apply_changes"));
    });

    await waitFor(() => {
      expect(updateData).toHaveBeenCalledTimes(1);
      expect(updateData).toHaveBeenCalledWith(
        99,
        expect.arrayContaining([expect.objectContaining({ id: 1 })])
      );
    });
  });

  test("executes afterUpdate actions only when explicitly configured", async () => {
    const user = userEvent.setup();
    const updateData = jest.fn(() => Promise.resolve());
    const afterUpdateAction = jest.fn(() => Promise.resolve());

    render(
      <EditableTable
        {...baseProps}
        updateData={updateData}
        afterUpdate={[
          {
            action: afterUpdateAction,
            propertyName: "media_uploads"
          }
        ]}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");

    await user.click(checkboxes[1]);
    await user.click(screen.getByText("event_list.edit_selected"));
    await act(async () => {
      await user.click(screen.getByText("bulk_actions_page.btn_apply_changes"));
    });

    await waitFor(() => {
      expect(updateData).toHaveBeenCalledTimes(1);
      expect(afterUpdateAction).toHaveBeenCalledTimes(1);
      expect(afterUpdateAction).toHaveBeenCalledWith(
        expect.objectContaining({ id: 11, event_id: 1 })
      );
    });
  });
});
