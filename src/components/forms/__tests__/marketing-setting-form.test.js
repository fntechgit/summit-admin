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
    default: ({ value, handleUpload, handleRemove }) => (
      <div>
        <button
          type="button"
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

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/editor-input-v3",
  () => ({
    __esModule: true,
    default: ({ id, value, onChange, error }) => (
      <div>
        <input
          data-testid={`editor-${id}`}
          value={value}
          onChange={(ev) =>
            onChange({
              target: { id, value: ev.target.value, type: "texteditor" }
            })
          }
        />
        {error && <p>{error}</p>}
      </div>
    )
  })
);

// Matches company-form.test.js's convention: mock the underlying
// mui-color-input package, not our MuiFormikColorField wrapper, so the
// wrapper's own commit-on-blur/Enter logic stays under test.
jest.mock("mui-color-input", () => ({
  MuiColorInput: ({ value, onChange, onBlur, name }) => (
    <input
      data-testid="color-input"
      name={name}
      value={value || ""}
      onChange={(ev) => onChange(ev.target.value)}
      onBlur={(ev) => onBlur({ target: { name, value: ev.target.value } })}
    />
  )
}));

// The vendor Formik-input wrappers (openstack-uicore-foundation) own their own
// error/FormHelperText rendering and have their own tests; here we only need
// them to read/write real Formik state, mirroring the mocking convention used
// elsewhere in this repo for these vendor components.
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

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/select",
  () => {
    const React = require("react");
    const { useField } = require("formik");
    return {
      __esModule: true,
      default: function MockMuiFormikSelect({ name, disabled, children }) {
        const [field] = useField(name);
        return (
          <select
            data-testid={`select-${name}`}
            disabled={disabled}
            value={field.value ?? ""}
            onChange={(ev) =>
              field.onChange({ target: { name, value: ev.target.value } })
            }
          >
            <option value="" />
            {React.Children.map(children, (child) => (
              <option value={child.props.value}>{child.props.children}</option>
            ))}
          </select>
        );
      }
    };
  }
);

// ---- Now imports ----
/* eslint-disable import/first */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { FormikProvider, useFormik } from "formik";
import MarketingSettingForm from "../marketing-setting-form";
import {
  buildValues,
  validationSchema
} from "../../../pages/marketing/edit-marketing-setting-page";
/* eslint-enable import/first */

const TEXT_ENTITY = {
  id: 0,
  key: "SOME_KEY",
  type: "TEXT",
  value: "hello",
  file_preview: "",
  file: null,
  selection_plan_id: ""
};

// Mirrors the formik wiring edit-marketing-setting-page.js provides in
// production, so MarketingSettingForm's useFormikContext() has a real
// context to read from.
const Harness = ({
  entity,
  onSubmit = jest.fn(),
  onDeleteImage = jest.fn(() => Promise.resolve())
}) => {
  const formik = useFormik({
    initialValues: buildValues(entity),
    validationSchema,
    onSubmit
  });

  return (
    <FormikProvider value={formik}>
      <MarketingSettingForm onDeleteImage={onDeleteImage} />
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

describe("MarketingSettingForm", () => {
  it("disables the type select once an existing setting is being edited", () => {
    render(<Harness entity={{ ...TEXT_ENTITY, id: 5 }} />);

    expect(screen.getByTestId("select-type")).toBeDisabled();
  });

  it("leaves the type select enabled for a new setting", () => {
    render(<Harness entity={TEXT_ENTITY} />);

    expect(screen.getByTestId("select-type")).not.toBeDisabled();
  });

  it("renders and round-trips the plain text value field", async () => {
    render(<Harness entity={TEXT_ENTITY} />);

    const input = screen.getByTestId("textfield-value");
    await userEvent.clear(input);
    await userEvent.type(input, "new value");

    expect(readFormikValues().value).toBe("new value");
  });

  it("renders and round-trips the html value field", async () => {
    render(
      <Harness
        entity={{ ...TEXT_ENTITY, type: "TEXTAREA", value: "<p>hi</p>" }}
      />
    );

    const editor = screen.getByTestId("editor-value");
    await userEvent.clear(editor);
    await userEvent.type(editor, "<p>bye</p>");

    expect(readFormikValues().value).toBe("<p>bye</p>");
  });

  it("renders and round-trips the hex color value field", async () => {
    render(
      <Harness entity={{ ...TEXT_ENTITY, type: "HEX_COLOR", value: "" }} />
    );

    // MuiFormikColorField only commits to formik on blur/Enter (it buffers
    // drag/typing locally to avoid re-rendering on every keystroke/frame).
    const colorInput = screen.getByTestId("color-input");
    fireEvent.change(colorInput, { target: { value: "#ff0000" } });
    fireEvent.blur(colorInput);

    expect(readFormikValues().value).toBe("#ff0000");
  });

  it("holds a newly picked file in formik state for the FILE type", async () => {
    render(<Harness entity={{ ...TEXT_ENTITY, type: "FILE", value: "" }} />);

    await userEvent.click(screen.getByRole("button", { name: "upload-file" }));

    expect(readFormikValues().file_preview).toBe("blob:new-file");
    expect(
      screen.getByRole("button", { name: "remove-file" })
    ).toBeInTheDocument();
  });

  it("blocks submit and surfaces required-field errors for an empty text setting", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        entity={{
          id: 0,
          key: "",
          type: "TEXT",
          value: "",
          file_preview: "",
          file: null,
          selection_plan_id: ""
        }}
        onSubmit={onSubmit}
      />
    );

    await clickSave();

    const errors = readFormikErrors();
    expect(errors.key).toBeTruthy();
    expect(errors.value).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submit for a FILE setting with no file attached", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        entity={{ ...TEXT_ENTITY, type: "FILE", value: "" }}
        onSubmit={onSubmit}
      />
    );

    await clickSave();

    expect(readFormikErrors().file_preview).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not require value for a FILE setting once a file is attached", async () => {
    const onSubmit = jest.fn();
    render(
      <Harness
        entity={{ ...TEXT_ENTITY, type: "FILE", value: "" }}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "upload-file" }));
    await clickSave();

    expect(readFormikErrors().file_preview).toBeUndefined();
    expect(onSubmit).toHaveBeenCalled();
  });

  it("removing the file for an existing setting deletes it and resets id to 0", async () => {
    const onDeleteImage = jest.fn(() => Promise.resolve());
    render(
      <Harness
        entity={{
          ...TEXT_ENTITY,
          id: 5,
          type: "FILE",
          value: "",
          file_preview: "https://cdn.example.com/existing.png"
        }}
        onDeleteImage={onDeleteImage}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "remove-file" }));

    expect(onDeleteImage).toHaveBeenCalledWith(5);
    expect(readFormikValues().id).toBe(0);
  });
});
