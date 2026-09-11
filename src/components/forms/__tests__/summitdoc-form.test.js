import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SummitDocForm from "../summitdoc-form";

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

const currentSummit = {
  event_types: [
    { id: 1, name: "Keynote" },
    { id: 2, name: "Panel" }
  ],
  selection_plans: [{ id: 10, name: "Plan A" }]
};

const baseEntity = {
  id: 0,
  name: "",
  label: "",
  description: "",
  event_types: [],
  file_preview: "",
  file: null,
  selection_plan_id: null,
  show_always: false,
  web_link: ""
};

const renderForm = (entityOverrides = {}, props = {}) =>
  render(
    <SummitDocForm
      currentSummit={currentSummit}
      entity={{ ...baseEntity, ...entityOverrides }}
      errors={{}}
      onSubmit={jest.fn()}
      addFileToDoc={jest.fn()}
      removeFileFromDoc={jest.fn()}
      {...props}
    />
  );

describe("SummitDocForm", () => {
  it("clears and disables event types when show_always is checked", async () => {
    renderForm({ event_types: [1] });

    const eventTypesSelect = screen.getByTestId("event-types-select");
    expect(eventTypesSelect).toHaveTextContent("Keynote");

    await userEvent.click(
      screen.getByRole("checkbox", { name: "summitdoc.show_always" })
    );

    expect(eventTypesSelect).not.toHaveTextContent("Keynote");
    expect(eventTypesSelect.querySelector("[role='combobox']")).toHaveClass(
      "Mui-disabled"
    );
  });

  it("disables the file upload when a web link is entered", async () => {
    renderForm();

    await userEvent.type(
      screen.getByLabelText("summitdoc.web_link *"),
      "http://example.com"
    );

    expect(screen.getByRole("button", { name: "upload-file" })).toBeDisabled();
  });

  it("disables the web link field once a file is present", () => {
    renderForm({ file_preview: "blob:existing-file" });

    expect(screen.getByLabelText("summitdoc.web_link *")).toBeDisabled();
  });

  it("holds the file in local state for a new doc and submits it together with the entity on save", async () => {
    const onSubmit = jest.fn();
    const addFileToDoc = jest.fn();
    renderForm({}, { onSubmit, addFileToDoc });

    await userEvent.click(screen.getByRole("button", { name: "upload-file" }));

    expect(addFileToDoc).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "remove-file" })
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ file_preview: "blob:new-file" }),
      { preview: "blob:new-file" }
    );
  });

  it("uploads/removes the file directly against the API for an existing doc", async () => {
    const addFileToDoc = jest.fn();
    const removeFileFromDoc = jest.fn();
    renderForm(
      { id: 5, file_preview: "blob:existing-file" },
      { addFileToDoc, removeFileFromDoc }
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
});
