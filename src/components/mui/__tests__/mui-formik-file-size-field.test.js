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
        await userEvent.clear(field);
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

    it("shows 0 when initial value is 0", () => {
      renderWithFormik(
        { label: "Max File Size", onSubmit: jest.fn() },
        { max_file_size: 0 }
      );

      const field = screen.getByLabelText("Max File Size");
      expect(field).toHaveValue(0);
    });
  });

  describe("clearing behavior", () => {
    it("shows empty field after clearing", async () => {
      renderWithFormik(
        { label: "Max File Size", onSubmit: jest.fn() },
        { max_file_size: 5 * BYTES_PER_MB }
      );

      const field = screen.getByLabelText("Max File Size");
      expect(field).toHaveValue(5);

      await act(async () => {
        await userEvent.clear(field);
      });

      expect(field).toHaveValue(null); // empty number input
    });

    it("submits 0 after clearing when initial value was numeric", async () => {
      const onSubmit = jest.fn();
      renderWithFormik(
        { label: "Max File Size", onSubmit },
        { max_file_size: 5 * BYTES_PER_MB }
      );

      const field = screen.getByLabelText("Max File Size");
      const submitButton = screen.getByText("submit");

      await act(async () => {
        await userEvent.clear(field);
        await userEvent.click(submitButton);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ max_file_size: 0 }),
        expect.anything()
      );
    });

    it("submits null after clearing when initial value was null", async () => {
      const onSubmit = jest.fn();
      renderWithFormik(
        { label: "Max File Size", onSubmit },
        { max_file_size: null }
      );

      const field = screen.getByLabelText("Max File Size");
      const submitButton = screen.getByText("submit");

      await act(async () => {
        await userEvent.type(field, "10");
        await userEvent.clear(field);
        await userEvent.click(submitButton);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ max_file_size: null }),
        expect.anything()
      );
    });

    it("accepts new value after clearing", async () => {
      const onSubmit = jest.fn();
      renderWithFormik(
        { label: "Max File Size", onSubmit },
        { max_file_size: 5 * BYTES_PER_MB }
      );

      const field = screen.getByLabelText("Max File Size");
      const submitButton = screen.getByText("submit");

      await act(async () => {
        await userEvent.clear(field);
        await userEvent.type(field, "20");
        await userEvent.click(submitButton);
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ max_file_size: 20 * BYTES_PER_MB }),
        expect.anything()
      );
    });
  });

  describe("zero as first character", () => {
    it("blocks zero as first character", async () => {
      renderWithFormik(
        { label: "Max File Size", onSubmit: jest.fn() },
        { max_file_size: null }
      );

      const field = screen.getByLabelText("Max File Size");

      await act(async () => {
        await userEvent.type(field, "0");
      });

      // zero is not a valid first character, field stays empty
      expect(field).toHaveValue(null);
    });

    it("blocks leading zero followed by digits", async () => {
      renderWithFormik(
        { label: "Max File Size", onSubmit: jest.fn() },
        { max_file_size: null }
      );

      const field = screen.getByLabelText("Max File Size");

      await act(async () => {
        await userEvent.type(field, "099");
      });

      // leading zero blocked, only "99" accepted
      expect(field).toHaveValue(99);
    });

    it("allows zero in non-leading position", async () => {
      renderWithFormik(
        { label: "Max File Size", onSubmit: jest.fn() },
        { max_file_size: null }
      );

      const field = screen.getByLabelText("Max File Size");

      await act(async () => {
        await userEvent.type(field, "10");
      });

      expect(field).toHaveValue(10);
    });
  });

  describe("blocked keys", () => {
    it.each(["e", "E", "+", "-", ".", ","])(
      "blocks '%s' key from being entered",
      async (key) => {
        renderWithFormik(
          { label: "Max File Size", onSubmit: jest.fn() },
          { max_file_size: 0 }
        );

        const field = screen.getByLabelText("Max File Size");

        await act(async () => {
          await userEvent.clear(field);
          await userEvent.type(field, key);
        });

        // field should remain empty since the key was blocked
        expect(field).toHaveValue(null);
      }
    );
  });
});
