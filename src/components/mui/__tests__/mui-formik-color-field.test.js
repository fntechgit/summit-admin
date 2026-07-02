import React from "react";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import * as yup from "yup";
import "@testing-library/jest-dom";
import MuiFormikColorField from "../formik-inputs/mui-formik-color-field";

jest.mock("mui-color-input", () => ({
  MuiColorInput: ({
    value,
    onChange,
    onBlur,
    onKeyDown,
    name,
    error,
    helperText
  }) => (
    <div>
      <input
        aria-label="color"
        name={name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onBlur({ target: { name, value: e.target.value } })}
        onKeyDown={onKeyDown}
      />
      {error && <span>{helperText}</span>}
    </div>
  )
}));

const renderWithFormik = ({
  onSubmit,
  validationSchema,
  initialValues = { color: "" }
}) =>
  render(
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      <Form>
        <MuiFormikColorField name="color" />
        <button type="submit">submit</button>
      </Form>
    </Formik>
  );

describe("MuiFormikColorField", () => {
  it("submits the initial value when the user never interacts with it", async () => {
    const onSubmit = jest.fn();
    renderWithFormik({ onSubmit, initialValues: { color: "#ff0000" } });

    await act(async () => {
      await userEvent.click(screen.getByText("submit"));
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#ff0000" }),
      expect.anything()
    );
  });

  it("commits the picked value to Formik only on blur, not on every change", async () => {
    const onSubmit = jest.fn();
    renderWithFormik({ onSubmit, initialValues: { color: "#ff0000" } });

    const field = screen.getByLabelText("color");
    fireEvent.change(field, { target: { value: "#00ff00" } });

    await act(async () => {
      await userEvent.click(screen.getByText("submit"));
    });
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ color: "#ff0000" }),
      expect.anything()
    );

    fireEvent.change(field, { target: { value: "#00ff00" } });
    fireEvent.blur(field);

    await act(async () => {
      await userEvent.click(screen.getByText("submit"));
    });
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ color: "#00ff00" }),
      expect.anything()
    );
  });

  it("submits the typed color when Enter submits the form before blur fires", async () => {
    const onSubmit = jest.fn();
    renderWithFormik({ onSubmit, initialValues: { color: "#ff0000" } });

    const field = screen.getByLabelText("color");
    fireEvent.change(field, { target: { value: "#00ff00" } });
    // Implicit form submission: the browser dispatches keydown, then submit,
    // without ever blurring the focused input.
    fireEvent.keyDown(field, { key: "Enter" });
    await act(async () => {
      fireEvent.submit(field.closest("form"));
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#00ff00" }),
      expect.anything()
    );
  });

  it("clears a validation error after a corrective edit and blur", async () => {
    renderWithFormik({
      onSubmit: jest.fn(),
      validationSchema: yup.object().shape({
        color: yup.string().matches(/^#([0-9a-fA-F]{6})$/, {
          message: "Invalid color",
          excludeEmptyString: true
        })
      })
    });

    const field = screen.getByLabelText("color");

    fireEvent.change(field, { target: { value: "invalid" } });
    fireEvent.blur(field);

    expect(await screen.findByText("Invalid color")).toBeInTheDocument();

    fireEvent.change(field, { target: { value: "#00ff00" } });
    fireEvent.blur(field);

    await waitFor(() =>
      expect(screen.queryByText("Invalid color")).not.toBeInTheDocument()
    );
  });
});
