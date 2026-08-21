import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TextValueDialog from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("TextValueDialog", () => {
  const onClose = jest.fn();
  const onSubmit = jest.fn(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders an empty text field with a disabled submit button when there is no value", () => {
    render(
      <TextValueDialog
        name="module_1"
        moduleName="Company Bio"
        open
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(
      screen.getByRole("button", {
        name: "edit_sponsor.mu_tab.upload_input.save_answer"
      })
    ).toBeDisabled();
  });

  it("enables submit once text is typed and calls onSubmit with it", async () => {
    render(
      <TextValueDialog
        name="module_1"
        moduleName="Company Bio"
        open
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    await userEvent.type(screen.getByRole("textbox"), "Hello sponsor");

    const submitButton = screen.getByRole("button", {
      name: "edit_sponsor.mu_tab.upload_input.save_answer"
    });
    expect(submitButton).toBeEnabled();

    await userEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith("Hello sponsor");
  });

  it("calls onClose when closing", async () => {
    render(
      <TextValueDialog
        name="module_1"
        open
        onClose={onClose}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
