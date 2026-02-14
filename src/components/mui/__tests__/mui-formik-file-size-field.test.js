import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, Form } from "formik";
import "@testing-library/jest-dom";
import MuiFormikFilesizeField from "../formik-inputs/mui-formik-file-size-field";
import { BYTES_PER_MB } from "../../../utils/constants";

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
        await userEvent.clear(field); // field initializes with 0
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
        { max_file_size: 15_728_640 } // 15 * 1_048_576
      );

      const field = screen.getByLabelText("Max File Size");
      expect(field).toHaveValue(15);
    });
  });
});
