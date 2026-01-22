import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import MuiFormikQuantityField from "../formik-inputs/mui-formik-quantity-field";

const renderWithFormik = (props, initialValues = { testField: [] }) =>
  render(
    <Formik initialValues={initialValues} onSubmit={props.onSubmit}>
      <Form>
        <MuiFormikQuantityField name="testField" {...props} />
        <button type="submit">submit</button>
      </Form>
    </Formik>
  );

describe("MuiFormikQuantityField", () => {
  it("must accept user input", async () => {
    const onSubmit = jest.fn();

    renderWithFormik({
      label: "some field",
      onSubmit
    });

    const field = screen.getByLabelText("some field");
    expect(field).toBeInTheDocument();

    const submitButton = screen.getByText("submit");
    await act(async () => {
      await userEvent.type(field, "12345");
      await userEvent.click(submitButton);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        testField: 12345
      }),
      expect.anything()
    );
  });

  it("must filter invalid characters", async () => {
    const onSubmit = jest.fn();

    renderWithFormik({
      label: "some field",
      onSubmit
    });

    const field = screen.getByLabelText("some field");
    expect(field).toBeInTheDocument();

    const submitButton = screen.getByText("submit");
    await act(async () => {
      await userEvent.type(field, "123eEe45");
      await userEvent.click(submitButton);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        testField: 12345
      }),
      expect.anything()
    );
  });
});
