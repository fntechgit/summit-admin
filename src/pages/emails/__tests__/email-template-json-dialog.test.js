import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import EmailTemplateJsonDialog from "../email-template-json-dialog";

jest.mock("@uiw/react-codemirror", () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid="json-editor"
      value={value}
      onChange={(ev) => onChange(ev.target.value)}
    />
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("EmailTemplateJsonDialog", () => {
  it("seeds the editor with the formatted jsonData when opened", () => {
    render(
      <EmailTemplateJsonDialog
        open
        jsonData={{ foo: "bar" }}
        renderErrors={[]}
        onUpdate={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("json-editor")).toHaveValue(
      JSON.stringify({ foo: "bar" }, null, 2)
    );
  });

  it("calls onUpdate with the parsed object when the JSON is valid", async () => {
    const onUpdate = jest.fn();
    render(
      <EmailTemplateJsonDialog
        open
        jsonData={{ foo: "bar" }}
        renderErrors={[]}
        onUpdate={onUpdate}
        onClose={jest.fn()}
      />
    );

    fireEvent.change(screen.getByTestId("json-editor"), {
      target: { value: JSON.stringify({ baz: 1 }) }
    });
    await userEvent.click(
      screen.getByRole("button", { name: "emails.update" })
    );

    expect(onUpdate).toHaveBeenCalledWith({ baz: 1 });
  });

  it("shows an inline error and does not call onUpdate when the JSON is invalid", async () => {
    const onUpdate = jest.fn();
    render(
      <EmailTemplateJsonDialog
        open
        jsonData={{ foo: "bar" }}
        renderErrors={[]}
        onUpdate={onUpdate}
        onClose={jest.fn()}
      />
    );

    fireEvent.change(screen.getByTestId("json-editor"), {
      target: { value: "not-json" }
    });
    await userEvent.click(
      screen.getByRole("button", { name: "emails.update" })
    );

    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("emails.invalid_json")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <EmailTemplateJsonDialog
        open={false}
        jsonData={{}}
        renderErrors={[]}
        onUpdate={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.queryByTestId("json-editor")).not.toBeInTheDocument();
  });
});
