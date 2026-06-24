import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TagsDialog from "../tags-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("TagsDialog", () => {
  let onClose;
  let onSave;

  beforeEach(() => {
    onClose = jest.fn();
    onSave = jest.fn();
  });

  const renderDialog = (props = {}) =>
    render(<TagsDialog onClose={onClose} onSave={onSave} {...props} />);

  const fillAndSubmit = async () => {
    await userEvent.type(screen.getByRole("textbox"), "new-tag");
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));
  };

  it("disables save and cancel buttons while onSave is pending", async () => {
    let resolveSave;
    onSave.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );

    renderDialog();
    await fillAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).toBeDisabled();
    });
    expect(
      screen.getByRole("button", { name: "general.cancel" })
    ).toBeDisabled();

    // Cleanup: resolve the pending save so no act() warnings fire
    await act(async () => {
      resolveSave();
      await Promise.resolve();
    });
  });

  it("does not re-trigger onSave while a save is in flight", async () => {
    let resolveSave;
    onSave.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );

    renderDialog();
    await userEvent.type(screen.getByRole("textbox"), "new-tag");

    const saveButton = screen.getByRole("button", { name: "general.save" });
    await userEvent.click(saveButton);

    // Wait for isSaving to take effect — button must be disabled before asserting
    await waitFor(() => expect(saveButton).toBeDisabled());
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
      await Promise.resolve();
    });
  });

  it("re-enables save and does not call onClose when onSave rejects", async () => {
    onSave.mockImplementation(() => Promise.reject(new Error("API error")));

    renderDialog();
    await fillAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "general.save" })
      ).not.toBeDisabled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
