import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import MuiFormikDatepicker from "../formik-inputs/mui-formik-datepicker";

const renderWithFormik = (props, initialValues = { test_date: null }) =>
  render(
    <Formik
      initialValues={initialValues}
      validate={(values) => {
        const errors = {};
        if (!values.test_date) {
          errors.test_date = "This field is required";
        }
        return errors;
      }}
      onSubmit={jest.fn()}
    >
      <Form>
        <MuiFormikDatepicker name="test_date" label="Test Date" {...props} />
      </Form>
    </Formik>
  );

describe("MuiFormikDatepicker", () => {
  test("shows required marker in label", () => {
    renderWithFormik({ required: true });

    expect(screen.getByLabelText("Test Date *")).toBeInTheDocument();
  });

  test("shows validation error when blurring without value", async () => {
    renderWithFormik({ required: true });

    expect(
      screen.queryByText("This field is required")
    ).not.toBeInTheDocument();

    const user = userEvent.setup();
    const input = screen.getByLabelText("Test Date *");
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });
  });
});
