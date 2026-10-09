import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForceDeleteExtraQuestionPopup from "../force-delete-extra-question-popup";

const QUESTION = { id: 9, name: "FAVORITE_COLOR" };

const buildUsage = (overrides = {}) => ({
  answers_count: 0,
  reps_count: 1,
  reps: [
    {
      member_id: 1,
      first_name: "Ana",
      last_name: "Perez",
      email: "ana@acme.com",
      scans_count: 4,
      last_scan_date: 1572019200
    }
  ],
  ...overrides
});

const renderPopup = ({
  usage = buildUsage(),
  getUsage = jest.fn(() => Promise.resolve(usage)),
  onConfirm = jest.fn(() => Promise.resolve()),
  onClose = jest.fn()
} = {}) => {
  render(
    <ForceDeleteExtraQuestionPopup
      extraQuestion={QUESTION}
      getUsage={getUsage}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
  return { getUsage, onConfirm, onClose };
};

const forceDeleteButton = () =>
  screen.getByRole("button", { name: "edit_sponsor.force_delete" });

const tickChecklist = async () => {
  await userEvent.click(screen.getByTestId("force-delete-check-devices"));
  await userEvent.click(screen.getByTestId("force-delete-check-pending"));
  await userEvent.click(screen.getByTestId("force-delete-check-third_party"));
};

const typeReason = (text) =>
  userEvent.type(screen.getByTestId("force-delete-reason"), text);

describe("ForceDeleteExtraQuestionPopup", () => {
  it("loads the usage of the question and shows what is at stake", async () => {
    const { getUsage } = renderPopup({
      usage: buildUsage({ answers_count: 23 })
    });

    expect(getUsage).toHaveBeenCalledWith(9);
    expect(
      await screen.findByText("edit_sponsor.force_delete_answers_count")
    ).toBeInTheDocument();
    expect(
      screen.getByText("edit_sponsor.force_delete_rep_activity")
    ).toBeInTheDocument();
  });

  it("keeps the button disabled until the usage is loaded", async () => {
    renderPopup({ getUsage: jest.fn(() => new Promise(() => {})) });

    expect(
      screen.getByText("edit_sponsor.force_delete_loading")
    ).toBeInTheDocument();
    expect(forceDeleteButton()).toBeDisabled();
  });

  it("can't force delete when the usage can't be loaded", async () => {
    renderPopup({ getUsage: jest.fn(() => Promise.reject(new Error("403"))) });

    expect(
      await screen.findByText("edit_sponsor.force_delete_usage_error")
    ).toBeInTheDocument();
    expect(forceDeleteButton()).toBeDisabled();
  });

  it("needs every checklist item and a reason before the button enables", async () => {
    renderPopup();
    await screen.findByTestId("force-delete-reason");

    expect(forceDeleteButton()).toBeDisabled();

    await typeReason("0 pending uploads on each device");
    expect(forceDeleteButton()).toBeDisabled();

    await userEvent.click(screen.getByTestId("force-delete-check-devices"));
    await userEvent.click(screen.getByTestId("force-delete-check-pending"));
    expect(forceDeleteButton()).toBeDisabled();

    await userEvent.click(screen.getByTestId("force-delete-check-third_party"));
    expect(forceDeleteButton()).toBeEnabled();
  });

  it("doesn't accept a blank reason", async () => {
    renderPopup();
    await screen.findByTestId("force-delete-reason");

    await tickChecklist();
    await typeReason("   ");

    expect(forceDeleteButton()).toBeDisabled();
  });

  it("deletes a question with no collected answers without asking to destroy any", async () => {
    const { onConfirm, onClose } = renderPopup();
    await screen.findByTestId("force-delete-reason");

    expect(
      screen.queryByTestId("force-delete-delete-answers")
    ).not.toBeInTheDocument();

    await tickChecklist();
    await typeReason("  created by mistake  ");
    await userEvent.click(forceDeleteButton());

    expect(onConfirm).toHaveBeenCalledWith(9, {
      reason: "created by mistake",
      deleteAnswers: false
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("asks a second confirmation before destroying collected answers", async () => {
    const { onConfirm } = renderPopup({
      usage: buildUsage({ answers_count: 23 })
    });
    await screen.findByTestId("force-delete-reason");

    await tickChecklist();
    await typeReason("sponsor insists");

    // everything else is done but the collected answers are not confirmed
    expect(forceDeleteButton()).toBeDisabled();
    expect(
      screen.getByText("edit_sponsor.force_delete_delete_answers_warning")
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("force-delete-delete-answers"));
    expect(forceDeleteButton()).toBeEnabled();

    await userEvent.click(forceDeleteButton());
    expect(onConfirm).toHaveBeenCalledWith(9, {
      reason: "sponsor insists",
      deleteAnswers: true
    });
  });

  it("stays open when the delete fails so it can be retried or cancelled", async () => {
    const onConfirm = jest.fn(() => Promise.reject(new Error("412")));
    const { onClose } = renderPopup({ onConfirm });
    await screen.findByTestId("force-delete-reason");

    await tickChecklist();
    await typeReason("sponsor insists");
    await userEvent.click(forceDeleteButton());

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() => expect(forceDeleteButton()).toBeEnabled());
  });

  it("can't be dismissed while the delete request runs", async () => {
    const onConfirm = jest.fn(() => new Promise(() => {}));
    const { onClose } = renderPopup({ onConfirm });
    await screen.findByTestId("force-delete-reason");

    await tickChecklist();
    await typeReason("sponsor insists");
    await userEvent.click(forceDeleteButton());
    expect(onConfirm).toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    await userEvent.click(document.querySelector(".MuiBackdrop-root"));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on ESC when nothing is being deleted", async () => {
    const { onClose } = renderPopup();
    await screen.findByTestId("force-delete-reason");

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("closes without deleting on cancel", async () => {
    const { onConfirm, onClose } = renderPopup();
    await screen.findByTestId("force-delete-reason");

    await userEvent.click(
      screen.getByRole("button", { name: "general.cancel" })
    );

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
