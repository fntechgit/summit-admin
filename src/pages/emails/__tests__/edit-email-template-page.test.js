import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import EditEmailTemplatePage from "../edit-email-template-page";
import {
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients
} from "../../../actions/email-actions";

jest.mock("../../../actions/email-actions", () => ({
  getEmailTemplate: jest.fn(),
  resetTemplateForm: jest.fn(),
  saveEmailTemplate: jest.fn(),
  getAllClients: jest.fn(),
  renderEmailTemplate: jest.fn(),
  updateTemplateJsonData: jest.fn()
}));

jest.mock("../../../components/forms/email-template-form", () => {
  const { forwardRef, useImperativeHandle } = require("react");
  return {
    __esModule: true,
    default: forwardRef(({ onSubmit, onRender }, ref) => {
      useImperativeHandle(ref, () => ({
        submit: () => onSubmit({ identifier: "Edited Template" })
      }));
      return (
        <div data-testid="email-template-form">
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
        <button type="button" onClick={() => onUpdate({ foo: "bar" })}>
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

const initialState = {
  emailTemplateState: {
    entity: { id: 0, identifier: "" },
    templateLoading: false,
    clients: null,
    preview: null,
    json_data: {},
    errors: {},
    render_errors: []
  }
};

describe("EditEmailTemplatePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEmailTemplate.mockReturnValue(() => Promise.resolve());
    resetTemplateForm.mockReturnValue({ type: "RESET_TEMPLATE_FORM" });
    saveEmailTemplate.mockReturnValue(() => Promise.resolve());
    getAllClients.mockReturnValue(() => Promise.resolve());
  });

  it("shows a loading state and defers mounting the form until the fetch resolves", async () => {
    let resolveFetch;
    getEmailTemplate.mockReturnValue(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    renderWithRedux(
      <EditEmailTemplatePage
        match={{
          url: "/app/emails/templates/42",
          params: { template_id: "42" }
        }}
      />,
      { initialState }
    );

    expect(screen.getByText("emails.loading_template")).toBeInTheDocument();
    expect(screen.queryByTestId("email-template-form")).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch();
      await flushPromises();
    });

    expect(
      screen.queryByText("emails.loading_template")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("email-template-form")).toBeInTheDocument();
  });

  it("resets the form and fetches clients when there is no template_id", () => {
    renderWithRedux(
      <EditEmailTemplatePage
        match={{ url: "/app/emails/templates/new", params: {} }}
      />,
      { initialState }
    );

    expect(resetTemplateForm).toHaveBeenCalled();
    expect(getEmailTemplate).not.toHaveBeenCalled();
    expect(getAllClients).toHaveBeenCalled();
  });

  it("fetches the entity when a template_id is present", () => {
    renderWithRedux(
      <EditEmailTemplatePage
        match={{
          url: "/app/emails/templates/42",
          params: { template_id: "42" }
        }}
      />,
      { initialState }
    );

    expect(getEmailTemplate).toHaveBeenCalledWith("42");
    expect(resetTemplateForm).not.toHaveBeenCalled();
  });

  it("submits the form through the imperative ref when Save is clicked", async () => {
    renderWithRedux(
      <EditEmailTemplatePage
        match={{
          url: "/app/emails/templates/42",
          params: { template_id: "42" }
        }}
      />,
      { initialState }
    );

    const saveButton = await screen.findByRole("button", {
      name: "general.save"
    });

    await act(async () => {
      await userEvent.click(saveButton);
      await flushPromises();
    });

    expect(saveEmailTemplate).toHaveBeenCalledWith({
      identifier: "Edited Template"
    });
  });

  it("opens the JSON dialog and applies an update", async () => {
    renderWithRedux(
      <EditEmailTemplatePage
        match={{ url: "/app/emails/templates/new", params: {} }}
      />,
      { initialState }
    );

    const openJsonButton = await screen.findByRole("button", {
      name: "open-json"
    });
    await userEvent.click(openJsonButton);
    expect(
      screen.getByTestId("email-template-json-dialog")
    ).toBeInTheDocument();

    const {
      updateTemplateJsonData
    } = require("../../../actions/email-actions");
    updateTemplateJsonData.mockReturnValue(() => Promise.resolve());

    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: "json-update" })
      );
      await flushPromises();
    });

    expect(updateTemplateJsonData).toHaveBeenCalledWith({ foo: "bar" });
    expect(
      screen.queryByTestId("email-template-json-dialog")
    ).not.toBeInTheDocument();
  });
});
