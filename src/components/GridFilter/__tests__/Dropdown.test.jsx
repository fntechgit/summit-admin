/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Dropdown from "../components/Dropdown";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" }
];

describe("Dropdown", () => {
  test("renders placeholder when no value is selected", () => {
    render(
      <Dropdown
        id="test"
        value=""
        options={options}
        placeholder="Pick one"
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  test("renders the selected option label", () => {
    render(
      <Dropdown
        id="test"
        value="b"
        options={options}
        placeholder="Pick one"
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  test("shows all options when opened", () => {
    render(
      <Dropdown
        id="test"
        value=""
        options={options}
        placeholder="Pick one"
        onChange={jest.fn()}
      />
    );
    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(
      screen.getByRole("option", { name: "Option A" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Option B" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Option C" })
    ).toBeInTheDocument();
  });

  test("renders placeholder when value is an empty array", () => {
    render(
      <Dropdown
        id="test"
        value={[]}
        options={options}
        placeholder="Pick one"
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  test("renders joined labels when value is an array", () => {
    render(
      <Dropdown
        id="test"
        value={["a", "c"]}
        options={options}
        placeholder="Pick one"
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Option A, Option C")).toBeInTheDocument();
  });

  test("calls onChange when an option is selected", () => {
    const onChange = jest.fn();
    render(
      <Dropdown
        id="test"
        value=""
        options={options}
        placeholder="Pick one"
        onChange={onChange}
      />
    );
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Option A" }));
    expect(onChange).toHaveBeenCalled();
  });
});
