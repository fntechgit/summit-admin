// mui-formik-radio-group.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import MuiFormikRadioGroup from "../formik-inputs/mui-formik-radio-group";

// Helper function to render the component with Formik
const renderWithFormik = (props, initialValues = { testField: "" }) => render(
    <Formik initialValues={initialValues} onSubmit={jest.fn()}>
      <Form>
        <MuiFormikRadioGroup name="testField" {...props} />
      </Form>
    </Formik>
  );

describe("MuiFormikRadioGroup", () => {
  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" }
  ];

  test("renders the component with label", () => {
    renderWithFormik({ label: "Test Radio Group", options });

    expect(screen.getByText("Test Radio Group")).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  test("renders all radio buttons with none selected when no default value", () => {
    renderWithFormik({ options });

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons).toHaveLength(3);
    radioButtons.forEach((radio) => {
      expect(radio).not.toBeChecked();
    });
  });

  test("renders with pre-selected value", () => {
    renderWithFormik({ options }, { testField: "option2" });

    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons[0]).not.toBeChecked(); // Option 1
    expect(radioButtons[1]).toBeChecked(); // Option 2
    expect(radioButtons[2]).not.toBeChecked(); // Option 3
  });

  test("handles selecting a radio button", async () => {
    renderWithFormik({ options });

    const radioButtons = screen.getAllByRole("radio");
    await userEvent.click(radioButtons[0]);

    // After clicking, the first radio should be checked and others should be unchecked
    expect(radioButtons[0]).toBeChecked();
    expect(radioButtons[1]).not.toBeChecked();
    expect(radioButtons[2]).not.toBeChecked();
  });

  test("handles changing selection", async () => {
    renderWithFormik({ options }, { testField: "option1" });

    const radioButtons = screen.getAllByRole("radio");
    // Initial state
    expect(radioButtons[0]).toBeChecked();
    expect(radioButtons[1]).not.toBeChecked();
    expect(radioButtons[2]).not.toBeChecked();

    // Change selection to option2
    await userEvent.click(radioButtons[1]);

    // After clicking, only the second radio should be checked
    expect(radioButtons[0]).not.toBeChecked();
    expect(radioButtons[1]).toBeChecked();
    expect(radioButtons[2]).not.toBeChecked();
  });

  test("displays error message when touched and has error", () => {
    render(
      <Formik
        initialValues={{ testField: "" }}
        initialErrors={{ testField: "This field is required" }}
        initialTouched={{ testField: true }}
        onSubmit={jest.fn()}
      >
        <Form>
          <MuiFormikRadioGroup name="testField" options={options} />
        </Form>
      </Formik>
    );

    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  test("does not display error message when not touched", () => {
    render(
      <Formik
        initialValues={{ testField: "" }}
        initialErrors={{ testField: "This field is required" }}
        initialTouched={{ testField: false }}
        onSubmit={jest.fn()}
      >
        <Form>
          <MuiFormikRadioGroup name="testField" options={options} />
        </Form>
      </Formik>
    );

    expect(
      screen.queryByText("This field is required")
    ).not.toBeInTheDocument();
  });

  test("passes additional props to RadioGroup", () => {
    renderWithFormik({ options, row: true });

    // The RadioGroup should have the row prop
    const radioGroup = screen.getByRole("radiogroup");
    expect(radioGroup).toHaveClass("MuiFormGroup-row");
  });

  test("generates correct key for each radio option", () => {
    renderWithFormik({ options });

    // Check that the keys are generated correctly by inspecting the rendered DOM
    const radioLabels = screen.getAllByRole("radio");
    expect(radioLabels).toHaveLength(3);

    const radioButtons = screen.getAllByRole("radio");
    // Check that the values match what we expect
    expect(radioButtons[0]).toHaveAttribute("value", "option1");
    expect(radioButtons[1]).toHaveAttribute("value", "option2");
    expect(radioButtons[2]).toHaveAttribute("value", "option3");
  });

  test("defaults to empty when no label is provided", () => {
    renderWithFormik({ options });

    // There should be no FormLabel element
    const formLabels = document.querySelectorAll(".MuiFormLabel-root");
    expect(formLabels.length).toBe(0);
  });
});
