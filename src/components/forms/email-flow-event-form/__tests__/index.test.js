// jsdom does not implement scrollIntoView; polyfill so the errors effect
// (which calls scrollToError -> firstNode.scrollIntoView) does not throw.
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

// Stands in for the real react-select AsyncSelect based input: exposes a
// button that fires the same {target: {id, value}} shape the real component
// dispatches on selection.
jest.mock("../../../inputs/email-template-input", () => ({
  __esModule: true,
  default: ({ id, onChange }) => (
    <button
      type="button"
      onClick={() =>
        onChange({
          target: { id, value: "NEW_TEMPLATE", type: "emailtemplateinput" }
        })
      }
    >
      pick-template
    </button>
  )
}));

// Mirrors the mocking convention used for marketing-setting-form.test.js:
// read/write real Formik state via useField, letting the wrapper's own
// error/FormHelperText rendering stay untested here (covered upstream).
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikTextField({ name }) {
        const [field] = useField(name);
        return <input data-testid={`textfield-${name}`} {...field} />;
      }
    };
  }
);

/* eslint-disable import/first */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FormikProvider, useFormik } from "formik";
import EmailFlowEventForm from "../index";
import {
  buildValues,
  validationSchema
} from "../../../../pages/email_flow_events/edit-email-flow-event-page";
/* eslint-enable import/first */

const BASE_ENTITY = {
  id: 5,
  flow_name: "REGISTRATION",
  event_type_name: "Attendee Registered",
  email_template_identifier: "",
  recipients: [],
  template_schema: null
};

// Mirrors the formik wiring edit-email-flow-event-page.js provides in
// production, so EmailFlowEventForm's useFormikContext() has a real context.
const Harness = ({ entity, onSubmit = jest.fn() }) => {
  const formik = useFormik({
    initialValues: buildValues(entity),
    validationSchema,
    onSubmit
  });

  return (
    <FormikProvider value={formik}>
      <EmailFlowEventForm entity={entity} />
      <button type="button" onClick={() => formik.handleSubmit()}>
        general.save
      </button>
      <pre data-testid="debug-values">{JSON.stringify(formik.values)}</pre>
      <pre data-testid="debug-errors">{JSON.stringify(formik.errors)}</pre>
    </FormikProvider>
  );
};

const readFormikValues = () =>
  JSON.parse(screen.getByTestId("debug-values").textContent);
const readFormikErrors = () =>
  JSON.parse(screen.getByTestId("debug-errors").textContent);

const clickSave = () =>
  userEvent.click(screen.getByRole("button", { name: "general.save" }));

describe("EmailFlowEventForm", () => {
  it("renders the read-only flow name and event type", () => {
    render(<Harness entity={BASE_ENTITY} />);

    expect(screen.getByText("REGISTRATION")).toBeInTheDocument();
    expect(screen.getByText("Attendee Registered")).toBeInTheDocument();
  });

  it("round-trips typed recipients into formik values", () => {
    render(<Harness entity={BASE_ENTITY} />);

    fireEvent.change(screen.getByTestId("textfield-recipients"), {
      target: { value: "a@example.com,b@example.com" }
    });

    expect(readFormikValues().recipients).toBe("a@example.com,b@example.com");
  });

  it("updates the email template identifier via EmailTemplateInput", async () => {
    render(<Harness entity={BASE_ENTITY} />);

    await userEvent.click(
      screen.getByRole("button", { name: "pick-template" })
    );

    expect(readFormikValues().email_template_identifier).toBe("NEW_TEMPLATE");
  });

  it("shows the see-template link and CopyClipboard when a template is set", () => {
    render(
      <Harness
        entity={{ ...BASE_ENTITY, email_template_identifier: "MY_TEMPLATE" }}
      />
    );

    expect(screen.getByRole("link", { name: "see template" })).toHaveAttribute(
      "href",
      "/app/emails/templates/MY_TEMPLATE"
    );
  });

  it("blocks submit and surfaces an error for an invalid recipient email", async () => {
    const onSubmit = jest.fn();
    render(<Harness entity={BASE_ENTITY} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("textfield-recipients"), {
      target: { value: "not-an-email" }
    });
    await clickSave();

    expect(readFormikErrors().recipients).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("allows submit with valid comma-separated recipient emails", async () => {
    const onSubmit = jest.fn();
    render(<Harness entity={BASE_ENTITY} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByTestId("textfield-recipients"), {
      target: { value: "a@example.com, b@example.com" }
    });
    await clickSave();

    expect(readFormikErrors().recipients).toBeUndefined();
    expect(onSubmit).toHaveBeenCalled();
  });

  it("allows submit with empty recipients (optional field)", async () => {
    const onSubmit = jest.fn();
    render(<Harness entity={BASE_ENTITY} onSubmit={onSubmit} />);

    await clickSave();

    expect(readFormikErrors().recipients).toBeUndefined();
    expect(onSubmit).toHaveBeenCalled();
  });
});
