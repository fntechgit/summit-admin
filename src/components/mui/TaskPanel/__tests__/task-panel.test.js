import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import TaskPanel from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const GUIDE = "task_panel.guides.selection_plan_setup";

const renderPanel = (summitId = 1) =>
  render(
    <MemoryRouter>
      <TaskPanel open onClose={jest.fn()} summitId={summitId} />
    </MemoryRouter>
  );

const startNewTask = () =>
  userEvent.click(screen.getByRole("button", { name: "task_panel.new_task" }));

const submit = () =>
  userEvent.click(screen.getByRole("button", { name: "task_panel.create" }));

const createTask = async (name) => {
  await startNewTask();
  await userEvent.click(screen.getByRole("combobox"));
  await userEvent.click(screen.getByRole("option", { name: `${GUIDE}.name` }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "task_panel.task_name" }),
    name
  );
  await submit();
};

const stepBox = (step) =>
  screen.getByRole("checkbox", { name: `${GUIDE}.steps.${step}` });

describe("TaskPanel", () => {
  it("creates a task from the chosen guide and name", async () => {
    renderPanel();
    expect(screen.getByText("task_panel.no_tasks")).toBeInTheDocument();

    await createTask("Breakout CFP");

    const [task] = await screen.findAllByRole("listitem");
    expect(task).toHaveTextContent("Breakout CFP");
    expect(task).toHaveTextContent(`${GUIDE}.name · 0/10`);
    expect(screen.queryByText("task_panel.no_tasks")).not.toBeInTheDocument();
  });

  it("needs a guide and a name before creating", async () => {
    renderPanel();

    await startNewTask();
    await submit();

    expect(await screen.findAllByText("validation.required")).toHaveLength(2);
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("needs a show before starting a task", () => {
    renderPanel(null);

    expect(
      screen.getByRole("button", { name: "task_panel.new_task" })
    ).toBeDisabled();
  });

  it("opens a task and ticks off its steps", async () => {
    renderPanel(7);
    await createTask("Breakout CFP");
    await userEvent.click(screen.getByText("Breakout CFP"));

    // the first unticked step starts open, linking to the task's show
    expect(
      screen.getByRole("link", { name: "task_panel.go_to_page" })
    ).toHaveAttribute("href", "/app/summits/7/marketing");
    await userEvent.click(stepBox("marketing"));
    expect(stepBox("marketing")).toBeChecked();

    // step 8 is ticked through its substeps
    await userEvent.click(screen.getByText(/steps\.selection_plan$/));
    const substeps = screen.getAllByRole("checkbox", {
      name: /substeps\.selection_plan\./
    });
    expect(substeps).toHaveLength(8);
    await userEvent.click(substeps[0]);
    expect(stepBox("selection_plan")).toHaveAttribute(
      "data-indeterminate",
      "true"
    );
    await userEvent.click(stepBox("selection_plan"));
    substeps.forEach((box) => expect(box).toBeChecked());

    await userEvent.click(
      screen.getByRole("button", { name: "task_panel.back" })
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("2/10");
  });
});
