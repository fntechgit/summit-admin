import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, useFormikContext } from "formik";
import "@testing-library/jest-dom";
import MuiFormikAsyncAutocomplete from "../formik-inputs/mui-formik-async-select";

jest.mock("@mui/material", () => {
  const actual = jest.requireActual("@mui/material");
  return {
    ...actual,
    Autocomplete: ({ onChange, onInputChange, options }) => (
      <>
        <input
          data-testid="search"
          onChange={(e) => onInputChange(e, e.target.value)}
        />
        <button
          type="button"
          data-testid="select-option"
          onClick={() => onChange({}, options[0])}
        >
          select
        </button>
      </>
    )
  };
});

const FieldValue = () => {
  const { values } = useFormikContext();
  return <div data-testid="field-value">{JSON.stringify(values.member)}</div>;
};

const renderWithFormik = (props) =>
  render(
    <Formik initialValues={{ member: null }} onSubmit={jest.fn()}>
      <>
        <MuiFormikAsyncAutocomplete name="member" {...props} />
        <FieldValue />
      </>
    </Formik>
  );

describe("MuiFormikAsyncAutocomplete", () => {
  test("keeps its internal onChange in control of the Formik field even when a consumer passes its own onChange prop", async () => {
    const queryFunction = (input, callback) =>
      callback([{ id: 1, name: "Jane Doe" }]);
    const consumerOnChange = jest.fn();

    await act(async () => {
      renderWithFormik({ queryFunction, onChange: consumerOnChange });
    });

    await userEvent.click(screen.getByTestId("select-option"));

    expect(consumerOnChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("field-value")).toHaveTextContent(
      JSON.stringify({ value: "1", label: "Jane Doe" })
    );
  });

  test("ignores the results of an older query that answers last", async () => {
    const pending = [];
    const queryFunction = (input, callback) => pending.push(callback);
    renderWithFormik({ queryFunction });

    await userEvent.type(screen.getByTestId("search"), "v");
    await waitFor(() => expect(pending).toHaveLength(2));
    act(() => pending[1]([{ id: 2, name: "VIP" }]));
    act(() => pending[0]([{ id: 1, name: "General" }]));
    await userEvent.click(screen.getByTestId("select-option"));

    expect(screen.getByTestId("field-value")).toHaveTextContent(
      JSON.stringify({ value: "2", label: "VIP" })
    );
  });
});
