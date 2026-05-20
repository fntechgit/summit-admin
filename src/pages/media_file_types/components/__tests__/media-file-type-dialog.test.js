import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaFileTypeDialog from "../media-file-type-dialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "../../../../components/mui/formik-inputs/mui-formik-textfield",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      default: ({ name, id, formik }) => (
        <input
          id={id || name}
          name={name}
          data-testid={`field-${name}`}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />
      )
    };
  }
);

jest.mock("../../../../hooks/useScrollToError", () => ({
  __esModule: true,
  default: jest.fn()
}));

const NEW_ENTITY = { id: 0, name: "", description: "", allowed_extensions: [] };

describe("MediaFileTypeDialog", () => {
  let onClose;
  let onSave;

  beforeEach(() => {
    onClose = jest.fn();
    onSave = jest.fn();
  });

  test("should show Add title for a new entity", () => {
    render(
      <MediaFileTypeDialog
        entity={NEW_ENTITY}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText(/general\.add/)).toBeInTheDocument();
  });

  test("should show Edit title for an existing entity", () => {
    render(
      <MediaFileTypeDialog
        entity={{
          id: 5,
          name: "Background Image",
          description: "Header Image in the background",
          allowed_extensions: ["JPG", "PNG"]
        }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText(/general\.edit/)).toBeInTheDocument();
  });

  test("should call onClose when close icon is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MediaFileTypeDialog
        entity={NEW_ENTITY}
        onClose={onClose}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("should call onSave with form values on valid submit", async () => {
    const user = userEvent.setup();
    render(
      <MediaFileTypeDialog
        entity={NEW_ENTITY}
        onClose={onClose}
        onSave={onSave}
      />
    );

    await user.type(screen.getByTestId("field-name"), "PDF Type");
    await user.type(screen.getByTestId("field-description"), "All PDF files");
    await user.type(screen.getByTestId("field-allowed_extensions"), "PDF");
    await user.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "PDF Type",
          description: "All PDF files",
          allowed_extensions: "PDF"
        })
      );
    });
  });

  test("should not call onSave when name is empty", async () => {
    const user = userEvent.setup();
    render(
      <MediaFileTypeDialog
        entity={NEW_ENTITY}
        onClose={onClose}
        onSave={onSave}
      />
    );

    await user.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  test("should prefill fields with existing entity values", () => {
    render(
      <MediaFileTypeDialog
        entity={{
          id: 3,
          name: "Video",
          description: "Video files",
          allowed_extensions: ["MP4", "AVI"]
        }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByTestId("field-name")).toHaveValue("Video");
    expect(screen.getByTestId("field-description")).toHaveValue("Video files");
    expect(screen.getByTestId("field-allowed_extensions")).toHaveValue(
      "MP4,AVI"
    );
  });

  test("should join array allowed_extensions to comma-separated string", () => {
    render(
      <MediaFileTypeDialog
        entity={{
          id: 2,
          name: "Docs",
          description: "",
          allowed_extensions: ["PDF", "DOC", "DOCX"]
        }}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByTestId("field-allowed_extensions")).toHaveValue(
      "PDF,DOC,DOCX"
    );
  });
});
