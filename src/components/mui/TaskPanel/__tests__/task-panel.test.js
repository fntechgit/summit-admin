import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import showConfirmDialog from "../../showConfirmDialog";
import TaskPanel from "../index";
import GUIDES from "../guides";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));
jest.mock("../../showConfirmDialog", () => jest.fn());

const GUIDE = "task_panel.guides.selection_plan_setup";

const renderPanel = (summit = { id: 1, name: "OCP 2026" }) =>
  render(
    <MemoryRouter>
      <TaskPanel open onClose={jest.fn()} summit={summit} />
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
    expect(task).toHaveTextContent(`OCP 2026 · ${GUIDE}.name · 0/10`);
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
    renderPanel({ id: 7, name: "OCP 2026" });
    await createTask("Breakout CFP");
    await userEvent.click(screen.getByText("Breakout CFP"));

    expect(screen.getByText(/^OCP 2026 · /)).toBeInTheDocument();
    // the first unticked step starts open, linking to the task's show
    expect(screen.getByText(`${GUIDE}.why.marketing`)).toBeInTheDocument();
    expect(
      screen.getByText(`${GUIDE}.instructions.marketing.upload`)
    ).toBeInTheDocument();
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

  describe("closing a task", () => {
    const closeTask = () =>
      userEvent.click(
        screen.getByRole("button", { name: "task_panel.close_task" })
      );

    beforeEach(async () => {
      showConfirmDialog.mockReset();
      renderPanel();
      await createTask("Breakout CFP");
      await userEvent.click(screen.getByText("Breakout CFP"));
    });

    it("asks first while steps are unticked, and keeps the task on cancel", async () => {
      showConfirmDialog.mockResolvedValue(false);

      await closeTask();

      expect(showConfirmDialog).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "task_panel.close_unfinished_warning"
        })
      );
      expect(
        screen.getByRole("button", { name: "task_panel.close_task" })
      ).toBeInTheDocument();
    });

    it("removes the task once confirmed", async () => {
      showConfirmDialog.mockResolvedValue(true);

      await closeTask();

      expect(
        await screen.findByText("task_panel.no_tasks")
      ).toBeInTheDocument();
    });

    it("closes a finished task without asking", async () => {
      // ticking in order keeps each next step's box in reach
      await GUIDES[0].steps.reduce(
        (previous, step) =>
          previous.then(() => userEvent.click(stepBox(step.id))),
        Promise.resolve()
      );

      await closeTask();

      expect(showConfirmDialog).not.toHaveBeenCalled();
      expect(screen.getByText("task_panel.no_tasks")).toBeInTheDocument();
    });
  });
});
