import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import EditEmailTemplatePopup from "../edit-email-template-popup";

jest.mock("../../../components/forms/email-template-form", () => {
  const { forwardRef, useImperativeHandle } = require("react");
  return {
    __esModule: true,
    default: forwardRef(({ onSubmit, onRender, templateJsonData }, ref) => {
      useImperativeHandle(ref, () => ({
        submit: () => onSubmit({ identifier: "Edited Template" })
      }));
      return (
        <div data-testid="email-template-form">
          <span data-testid="json-data">
            {JSON.stringify(templateJsonData)}
          </span>
          <button type="button" onClick={onRender}>
            open-json
          </button>
        </div>
      );
    })
  };
});

jest.mock("../email-template-json-dialog", () => ({
  __esModule: true,
  default: ({ open, onUpdate, onClose }) =>
    open ? (
      <div data-testid="email-template-json-dialog">
        <button type="button" onClick={() => onUpdate({ baz: 1 })}>
          json-update
        </button>
        <button type="button" onClick={onClose}>
          json-close
        </button>
      </div>
    ) : null
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const baseProps = (overrides = {}) => ({
  entity: { id: 0, identifier: "" },
  templateLoading: false,
  errors: {},
  clients: [],
  preview: null,
  renderErrors: [],
  templateJsonData: { foo: "bar" },
  renderEmailTemplate: jest.fn(),
  updateTemplateJsonData: jest.fn(() => Promise.resolve()),
  onSave: jest.fn(() => Promise.resolve()),
  onClose: jest.fn(),
  ...overrides
});

describe("EditEmailTemplatePopup", () => {
  it("submits the form through the imperative ref and closes on a successful save", async () => {
    const onSave = jest.fn(() => Promise.resolve());
    const onClose = jest.fn();
    render(<EditEmailTemplatePopup {...baseProps({ onSave, onClose })} />);

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "general.save" })
      );
      await flushPromises();
    });

    expect(onSave).toHaveBeenCalledWith({ identifier: "Edited Template" });
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the dialog open and re-enables the Save button when the save rejects", async () => {
    const onSave = jest.fn(() => Promise.reject(new Error("save failed")));
    const onClose = jest.fn();
    render(<EditEmailTemplatePopup {...baseProps({ onSave, onClose })} />);

    const saveButton = screen.getByRole("button", { name: "general.save" });
    await act(async () => {
      await userEvent.click(saveButton);
      await flushPromises();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(saveButton).not.toBeDisabled();
  });

  it("disables both the Save button and the close icon while a save is in flight", async () => {
    let resolveSave;
    const onSave = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );
    render(<EditEmailTemplatePopup {...baseProps({ onSave })} />);

    const saveButton = screen.getByRole("button", { name: "general.save" });
    await userEvent.click(saveButton);

    // blocks a UI-level double-submit and closing mid-save
    expect(saveButton).toBeDisabled();
    expect(onSave).toHaveBeenCalledTimes(1);
    const closeButton = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector("svg"));
    expect(closeButton).toBeDisabled();

    await act(async () => {
      resolveSave();
      await flushPromises();
    });
  });

  it("closes immediately when not saving", async () => {
    const onClose = jest.fn();
    render(<EditEmailTemplatePopup {...baseProps({ onClose })} />);

    const closeButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg"));
    await userEvent.click(closeButtons[0]);

    expect(onClose).toHaveBeenCalled();
  });

  it("opens the JSON dialog from the form and applies an update", async () => {
    const updateTemplateJsonData = jest.fn(() => Promise.resolve());
    render(
      <EditEmailTemplatePopup {...baseProps({ updateTemplateJsonData })} />
    );

    expect(
      screen.queryByTestId("email-template-json-dialog")
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "open-json" }));
    expect(
      screen.getByTestId("email-template-json-dialog")
    ).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "json-update" })
      );
      await flushPromises();
    });

    expect(updateTemplateJsonData).toHaveBeenCalledWith({ baz: 1 });
    expect(
      screen.queryByTestId("email-template-json-dialog")
    ).not.toBeInTheDocument();
    // the updated JSON data flows back into the form
    expect(screen.getByTestId("json-data")).toHaveTextContent(
      JSON.stringify({ baz: 1 })
    );
  });
});
