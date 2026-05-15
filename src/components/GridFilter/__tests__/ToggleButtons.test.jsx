/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ToggleButtons from "../components/ToggleButtons";

const options = ["all", "any"];

describe("ToggleButtons", () => {
  test("renders all options", () => {
    render(
      <ToggleButtons options={options} value="all" onChange={jest.fn()} />
    );
    expect(screen.getByText("all")).toBeInTheDocument();
    expect(screen.getByText("any")).toBeInTheDocument();
  });

  test("marks the active option as selected", () => {
    render(
      <ToggleButtons options={options} value="all" onChange={jest.fn()} />
    );
    expect(screen.getByText("all").closest("button")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("any").closest("button")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  test("calls onChange when a different option is clicked", () => {
    const onChange = jest.fn();
    render(<ToggleButtons options={options} value="all" onChange={onChange} />);
    fireEvent.click(screen.getByText("any"));
    expect(onChange).toHaveBeenCalledWith("any");
  });

  test("does not call onChange when the active option is clicked", () => {
    const onChange = jest.fn();
    render(<ToggleButtons options={options} value="all" onChange={onChange} />);
    fireEvent.click(screen.getByText("all"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
