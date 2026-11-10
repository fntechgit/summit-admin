import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TaskPanel from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const renderPanel = () => render(<TaskPanel open onClose={jest.fn()} />);

const startNewTask = () =>
  userEvent.click(screen.getByRole("button", { name: "task_panel.new_task" }));

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "task_panel.create" }));

describe("TaskPanel", () => {
  it("creates a task from the chosen guide and name", async () => {
    renderPanel();
    expect(screen.getByText("task_panel.no_tasks")).toBeInTheDocument();

    await startNewTask();
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(
      screen.getByRole("option", {
        name: "task_panel.guides.selection_plan_setup"
      })
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "task_panel.task_name" }),
      "Breakout CFP"
    );
    await submit();

    const [task] = await screen.findAllByRole("listitem");
    expect(task).toHaveTextContent("Breakout CFP");
    expect(task).toHaveTextContent("task_panel.guides.selection_plan_setup");
    expect(screen.queryByText("task_panel.no_tasks")).not.toBeInTheDocument();
  });

  it("needs a guide and a name before creating", async () => {
    renderPanel();

    await startNewTask();
    await submit();

    expect(await screen.findAllByText("validation.required")).toHaveLength(2);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
