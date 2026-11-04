import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik, useFormikContext } from "formik";
import "@testing-library/jest-dom";
import EditLabelSlider from "../edit-label-slider";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const FieldValue = () => {
  const { values } = useFormikContext();
  return (
    <div data-testid="field-value">{JSON.stringify(values.filters[0])}</div>
  );
};

const renderWithFormik = (props = {}) =>
  render(
    <Formik
      initialValues={{
        filters: [{ type: "TRACK", label: "Category", is_enabled: false }]
      }}
      onSubmit={jest.fn()}
    >
      <>
        <EditLabelSlider name="filters[0]" {...props} />
        <FieldValue />
      </>
    </Formik>
  );

const fieldValue = () =>
  JSON.parse(screen.getByTestId("field-value").textContent);

describe("EditLabelSlider", () => {
  test("toggling the switch updates is_enabled", async () => {
    renderWithFormik();

    await userEvent.click(screen.getByRole("checkbox", { name: "Category" }));

    expect(fieldValue().is_enabled).toBe(true);
  });

  test("Save commits the edited label", async () => {
    renderWithFormik();

    await userEvent.click(
      screen.getByRole("button", { name: "edit_schedule_settings.edit_name" })
    );
    const input = screen.getByRole("textbox", {
      name: "edit_schedule_settings.edit_name"
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Tracks");

    expect(fieldValue().label).toBe("Category");

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(fieldValue().label).toBe("Tracks");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  test("Enter commits the edited label without submitting the parent form", async () => {
    const onSubmit = jest.fn();
    render(
      <Formik
        initialValues={{
          filters: [{ type: "TRACK", label: "Category", is_enabled: false }]
        }}
        onSubmit={onSubmit}
      >
        {({ handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <EditLabelSlider name="filters[0]" />
            <FieldValue />
            <button type="submit">submit</button>
          </form>
        )}
      </Formik>
    );

    await userEvent.click(
      screen.getByRole("button", { name: "edit_schedule_settings.edit_name" })
    );
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "Tracks{enter}");

    expect(fieldValue().label).toBe("Tracks");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("Cancel discards the draft and the next edit starts from the saved label", async () => {
    renderWithFormik();

    const editButton = () =>
      screen.getByRole("button", { name: "edit_schedule_settings.edit_name" });

    await userEvent.click(editButton());
    await userEvent.type(screen.getByRole("textbox"), " draft");
    await userEvent.click(
      screen.getByRole("button", { name: "general.cancel" })
    );

    expect(fieldValue().label).toBe("Category");

    await userEvent.click(editButton());

    expect(screen.getByRole("textbox")).toHaveValue("Category");
  });

  test("hides the edit link and disables the switch when disabled", () => {
    renderWithFormik({ disabled: true });

    expect(
      screen.queryByRole("button", { name: "edit_schedule_settings.edit_name" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Category" })).toBeDisabled();
  });
});
