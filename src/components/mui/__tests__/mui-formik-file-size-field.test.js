import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import MuiFormikFilesizeField from "../formik-inputs/mui-formik-file-size-field";

const BYTES_PER_MB = 1_000_000;

const renderWithFormik = (props, initialValues = { max_file_size: 0 }) =>
  render(
    <Formik initialValues={initialValues} onSubmit={props.onSubmit}>
      <Form>
        <MuiFormikFilesizeField name="max_file_size" {...props} />
        <button type="submit">submit</button>
      </Form>
    </Formik>
  );

describe("MuiFormikFilesizeField", () => {
  describe("display and store", () => {
    it("converts MB input to bytes", async () => {
      const onSubmit = jest.fn();
      renderWithFormik({
        label: "Max File Size",
        onSubmit
      });

      const field = screen.getByLabelText("Max File Size");
      const submitButton = screen.getByText("submit");

      await act(async () => {
        await userEvent.type(field, "10");
        await userEvent.click(submitButton);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          max_file_size: 10 * BYTES_PER_MB
        }),
        expect.anything()
      );
    });

    it("displays bytes as MB", async () => {
      const onSubmit = jest.fn();
      renderWithFormik(
        {
          label: "Max File Size",
          onSubmit
        },
        { max_file_size: 15_000_000 }
      );

      const field = screen.getByLabelText("Max File Size");
      expect(field).toHaveValue(15);
    });
  });

  describe("Empty Value Handling", () => {
    it("auto-detects null emptyValue from initialValues", async () => {
      const onSubmit = jest.fn();
      renderWithFormik(
        {
          label: "Max File Size",
          onSubmit
        },
        { max_file_size: null }
      );

      const field = screen.getByLabelText("Max File Size");
      const submitButton = screen.getByText("submit");

      await act(async () => {
        await userEvent.type(field, "5");
        await userEvent.clear(field);
        await userEvent.click(submitButton);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          max_file_size: null
        }),
        expect.anything()
      );
    });

    it("auto-detects string emptyValue from initialValues", async () => {
      const onSubmit = jest.fn();

      renderWithFormik(
        {
          label: "Max File Size",
          onSubmit
        },
        { max_file_size: "" }
      );

      const field = screen.getByLabelText("Max File Size");
      const submitButton = screen.getByText("submit");

      await act(async () => {
        await userEvent.type(field, "5");
        await userEvent.clear(field);
        await userEvent.click(submitButton);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          max_file_size: ""
        }),
        expect.anything()
      );
    });
  });
});
