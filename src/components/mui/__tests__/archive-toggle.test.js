import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ArchiveToggle from "../archive-toggle";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const activeButton = () =>
  screen.getByRole("button", { name: "general.active" });
const archivedButton = () =>
  screen.getByRole("button", { name: "general.archived" });

describe("ArchiveToggle", () => {
  test("selects Active when showArchived is false", () => {
    render(<ArchiveToggle showArchived={false} onChange={jest.fn()} />);
    expect(activeButton()).toHaveAttribute("aria-pressed", "true");
    expect(archivedButton()).toHaveAttribute("aria-pressed", "false");
  });

  test("selects Archived when showArchived is true", () => {
    render(<ArchiveToggle showArchived onChange={jest.fn()} />);
    expect(archivedButton()).toHaveAttribute("aria-pressed", "true");
    expect(activeButton()).toHaveAttribute("aria-pressed", "false");
  });

  test("calls onChange(true) when switching to Archived", async () => {
    const onChange = jest.fn();
    render(<ArchiveToggle showArchived={false} onChange={onChange} />);
    await userEvent.click(archivedButton());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test("calls onChange(false) when switching to Active", async () => {
    const onChange = jest.fn();
    render(<ArchiveToggle showArchived onChange={onChange} />);
    await userEvent.click(activeButton());
    expect(onChange).toHaveBeenCalledWith(false);
  });

  test("does not call onChange when the selected segment is clicked again", async () => {
    const onChange = jest.fn();
    render(<ArchiveToggle showArchived={false} onChange={onChange} />);
    await userEvent.click(activeButton());
    expect(onChange).not.toHaveBeenCalled();
  });
});
