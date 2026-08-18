import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TextPreviewModal from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("TextPreviewModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn() },
      configurable: true
    });
  });

  it("renders the title and the stored text value", () => {
    render(
      <TextPreviewModal
        title="Company Bio"
        open
        onClose={onClose}
        value="This is the sponsor's answer"
      />
    );

    expect(screen.getByText("Company Bio")).toBeInTheDocument();
    expect(
      screen.getByText("This is the sponsor's answer")
    ).toBeInTheDocument();
  });

  it("copies the value to the clipboard when the copy button is clicked", async () => {
    render(
      <TextPreviewModal
        title="Company Bio"
        open
        onClose={onClose}
        value="Copy me"
      />
    );

    const copyButton = screen.getByRole("button", {
      name: "general.copy_to_clipboard"
    });

    await userEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copy me");
    expect(copyButton).toHaveTextContent("general.copied");
  });

  it("calls onClose when closing", async () => {
    render(
      <TextPreviewModal title="Company Bio" open onClose={onClose} value="x" />
    );

    await userEvent.click(screen.getByRole("button", { name: "close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
