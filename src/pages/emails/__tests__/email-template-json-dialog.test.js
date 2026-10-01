import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
  it.each([
    ["resolves", true],
    ["rejects", false]
  ])(
    "seeds the formatted JSON, sends the parsed edit, and closes only when the update %s",
    async (_outcome, closes) => {
      const onUpdate = jest.fn(() =>
        closes ? Promise.resolve() : Promise.reject(new Error("failed"))
      );
      const onClose = jest.fn();
      render(
        <EmailTemplateJsonDialog
          jsonData={{ foo: "bar" }}
          renderErrors={[]}
          onUpdate={onUpdate}
          onClose={onClose}
        />
      );

      const editor = screen.getByTestId("json-editor");
      expect(editor).toHaveValue(JSON.stringify({ foo: "bar" }, null, 2));

      fireEvent.change(editor, {
        target: { value: JSON.stringify({ baz: 1 }) }
      });
      await userEvent.click(
        screen.getByRole("button", { name: "emails.update" })
      );

      await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({ baz: 1 }));
      if (closes) await waitFor(() => expect(onClose).toHaveBeenCalled());
      else expect(onClose).not.toHaveBeenCalled();
    }
  );

  it("shows an inline error and does not call onUpdate when the JSON is invalid", async () => {
    const onUpdate = jest.fn();
    render(
      <EmailTemplateJsonDialog
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

    expect(await screen.findByText("emails.invalid_json")).toBeInTheDocument();
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
