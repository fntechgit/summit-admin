// ---- Mocks must come first ----

// jsdom does not implement scrollIntoView; polyfill so the errors effect
// (which calls scrollToError -> firstNode.scrollIntoView) does not throw.
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input",
  () => ({
    __esModule: true,
    default: ({ value, handleUpload, handleRemove, disabled }) => (
      <div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleUpload({ preview: "blob:new-file" })}
        >
          upload-file
        </button>
        {value && (
          <button type="button" onClick={() => handleRemove()}>
            remove-file
          </button>
        )}
      </div>
    )
  })
);

// The vendor Formik-input wrappers (openstack-uicore-foundation) own their own
// error/FormHelperText rendering and have their own tests; here we only need
// them to read/write real Formik state, mirroring company-form.test.js and
// payment-profile-dialog.test.js's mocking convention for these components.
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikTextField({ name, disabled }) {
        const [field] = useField(name);
        return (
          <input
            data-testid={`textfield-${name}`}
            disabled={disabled}
            {...field}
          />
        );
      }
    };
  }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/select",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikSelect({ name, disabled }) {
        const [field] = useField(name);
        return (
          <div
            data-testid={`select-${name}`}
            data-disabled={String(!!disabled)}
          >
            {JSON.stringify(field.value)}
          </div>
        );
      }
    };
  }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/checkbox",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikCheckbox({ name, label, ...props }) {
        const [field] = useField({ name, type: "checkbox" });
        return (
          <label>
            {label}
            <input
              type="checkbox"
              data-testid={`checkbox-${name}`}
              checked={field.value}
              {...field}
              {...props}
            />
          </label>
        );
      }
    };
  }
);

// ---- Now imports ----
/* eslint-disable import/first */
import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FormikProvider, useFormik } from "formik";
import SummitDocForm from "../summitdoc-form";
import {
  buildValues,
  validationSchema
} from "../../../pages/summitdocs/edit-summitdoc-page";
/* eslint-enable import/first */

const currentSummit = {
  event_types: [
    { id: 1, name: "Keynote" },
    { id: 2, name: "Panel" }
  ],
  selection_plans: [{ id: 10, name: "Plan A" }]
};

const VALID_ENTITY = {
  id: 0,
  name: "A doc",
  label: "A label",
  description: "A description",
  event_types: [1],
  file_preview: "",
  selection_plan_id: null,
  show_always: false,
  web_link: ""
};

// Mirrors the formik wiring edit-summitdoc-page.js provides in production, so
// SummitDocForm's useFormikContext() has a real context to read from.
const Harness = ({
  entity,
  onSubmit = jest.fn(),
  addFileToDoc = jest.fn(),
  removeFileFromDoc = jest.fn()
}) => {
  const [file, setFile] = useState(null);
  const formik = useFormik({
    initialValues: buildValues(entity),
    validationSchema,
    onSubmit: (values) => onSubmit(values, file)
  });

  return (
    <FormikProvider value={formik}>
      <SummitDocForm
        currentSummit={currentSummit}
        addFileToDoc={addFileToDoc}
        removeFileFromDoc={removeFileFromDoc}
        setFile={setFile}
      />
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

describe("SummitDocForm", () => {
  it("clears and disables event types when show_always is checked", async () => {
    render(<Harness entity={{ ...VALID_ENTITY, event_types: [1] }} />);

    expect(screen.getByTestId("select-event_types")).toHaveTextContent("[1]");

    await userEvent.click(
      screen.getByRole("checkbox", { name: "summitdoc.show_always" })
    );

    expect(readFormikValues().event_types).toEqual([]);
    expect(screen.getByTestId("select-event_types")).toHaveAttribute(
      "data-disabled",
      "true"
    );
  });

  it("disables the file upload when a web link is entered", async () => {
    render(<Harness entity={VALID_ENTITY} />);

    await userEvent.type(
      screen.getByTestId("textfield-web_link"),
      "http://example.com"
    );

    expect(screen.getByRole("button", { name: "upload-file" })).toBeDisabled();
  });

  it("disables the web link field once a file is present", () => {
    render(
      <Harness
        entity={{ ...VALID_ENTITY, file_preview: "blob:existing-file" }}
      />
    );

    expect(screen.getByTestId("textfield-web_link")).toBeDisabled();
  });

  it("shows an existing doc's server-side file and disables web_link for it", () => {
    render(
      <Harness
        entity={{
          ...VALID_ENTITY,
          id: 5,
          file_preview: "",
          file: "https://cdn.example.com/existing.pdf"
        }}
      />
    );

    expect(
      screen.getByRole("button", { name: "remove-file" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("textfield-web_link")).toBeDisabled();
  });

  it("holds the file in local state for a new doc and submits it together with the entity on save", async () => {
    const onSubmit = jest.fn();
    const addFileToDoc = jest.fn();
    render(
      <Harness
        entity={VALID_ENTITY}
        onSubmit={onSubmit}
        addFileToDoc={addFileToDoc}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "upload-file" }));

    expect(addFileToDoc).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "remove-file" })
    ).toBeInTheDocument();

    await clickSave();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ file_preview: "blob:new-file" }),
      { preview: "blob:new-file" }
    );
  });

  it("uploads/removes the file directly against the API for an existing doc", async () => {
    const addFileToDoc = jest.fn();
    const removeFileFromDoc = jest.fn();
    render(
      <Harness
        entity={{ ...VALID_ENTITY, id: 5, file_preview: "blob:existing-file" }}
        addFileToDoc={addFileToDoc}
        removeFileFromDoc={removeFileFromDoc}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "upload-file" }));
    expect(addFileToDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5 }),
      { preview: "blob:new-file" }
    );

    await userEvent.click(screen.getByRole("button", { name: "remove-file" }));
    expect(removeFileFromDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 5 })
    );
  });

  it("blocks submit and surfaces required-field errors (including event_types) on an empty doc", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        entity={{
          id: 0,
          name: "",
          label: "",
          description: "",
          event_types: [],
          file_preview: "",
          selection_plan_id: null,
          show_always: false,
          web_link: ""
        }}
        onSubmit={onSubmit}
      />
    );

    await clickSave();

    const errors = readFormikErrors();
    expect(errors.name).toBeTruthy();
    expect(errors.label).toBeTruthy();
    expect(errors.description).toBeTruthy();
    expect(errors.event_types).toBeTruthy();
    expect(errors.web_link).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not require web_link when editing a doc that already has a server-side file", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        entity={{
          ...VALID_ENTITY,
          id: 5,
          file_preview: "",
          file: "https://cdn.example.com/existing.pdf",
          web_link: ""
        }}
        onSubmit={onSubmit}
      />
    );

    // Editing an unrelated field re-runs validation against the whole
    // schema - this used to flash a false "web_link required" error
    // because entity.file (the existing file) never reached formik state.
    await userEvent.type(
      screen.getByTestId("textfield-description"),
      " updated"
    );

    expect(readFormikErrors().web_link).toBeUndefined();
  });

  it("does not require event_types when show_always is checked, and submits successfully", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        entity={{
          ...VALID_ENTITY,
          event_types: [],
          web_link: "http://example.com"
        }}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(
      screen.getByRole("checkbox", { name: "summitdoc.show_always" })
    );
    await clickSave();

    expect(readFormikErrors().event_types).toBeUndefined();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ show_always: true, event_types: [] }),
      null
    );
  });
});
