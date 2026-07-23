import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MediaUploadDialog from "../media-upload-dialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () =>
    function MockTextField({ name }) {
      // eslint-disable-next-line global-require
      const { useField } = require("formik");
      const [field, meta] = useField(name);
      return (
        <>
          <input
            data-testid={`textfield-${name}`}
            name={name}
            value={field.value ?? ""}
            onChange={field.onChange}
          />
          {meta.touched && meta.error && <span>{meta.error}</span>}
        </>
      );
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/file-size-field",
  () =>
    function MockFilesizeField({ name }) {
      // eslint-disable-next-line global-require
      const { useField } = require("formik");
      const [field, meta] = useField(name);
      return (
        <>
          <input
            data-testid={`filesize-${name}`}
            name={name}
            value={field.value ?? ""}
            onChange={field.onChange}
          />
          {meta.touched && meta.error && <span>{meta.error}</span>}
        </>
      );
    }
);

jest.mock(
  "../../../../components/mui/formik-inputs/mui-formik-select",
  () =>
    function MockSelect({ name, children }) {
      return <div data-testid={`select-${name}`}>{children}</div>;
    }
);

jest.mock(
  "../../../../components/inputs/formik-text-editor",
  () =>
    function MockTextEditor({ name }) {
      return <textarea data-testid={`editor-${name}`} name={name} />;
    }
);

jest.mock("../../../../hooks/useScrollToError", () => jest.fn());

const BASE_ENTITY = {
  id: 0,
  name: "",
  description: "",
  type_id: 0,
  max_size: 0,
  min_uploads_qty: 0,
  max_uploads_qty: 0,
  is_mandatory: false,
  is_editable: true,
  private_storage_type: "None",
  public_storage_type: "None",
  presentation_types: [],
  use_temporary_links_on_public_storage: false,
  temporary_links_public_storage_ttl: 0
};

const CURRENT_SUMMIT = {
  id: 42,
  event_types: [
    { id: 1, name: "Talk", class_name: "PresentationType" },
    { id: 2, name: "Panel", class_name: "PresentationType" },
    { id: 3, name: "Keynote", class_name: "SummitEventType" }
  ]
};

describe("MediaUploadDialog", () => {
  let onSave;
  let onClose;

  beforeEach(() => {
    jest.clearAllMocks();
    window.PUBLIC_STORAGES = [];
    onSave = jest.fn(() => Promise.resolve());
    onClose = jest.fn();
  });

  afterEach(() => {
    delete window.PUBLIC_STORAGES;
  });

  const renderDialog = (
    entity = BASE_ENTITY,
    errors = {},
    mediaFileTypes = []
  ) =>
    render(
      <MediaUploadDialog
        currentSummit={CURRENT_SUMMIT}
        entity={entity}
        errors={errors}
        mediaFileTypes={mediaFileTypes}
        onSave={onSave}
        onClose={onClose}
      />
    );

  it("renders the name and max_size fields by default", () => {
    renderDialog();

    expect(screen.getByTestId("textfield-name")).toBeInTheDocument();
    expect(screen.getByTestId("filesize-max_size")).toBeInTheDocument();
  });

  it("only shows the TTL field once use_temporary_links_on_public_storage is checked", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(
      screen.queryByTestId("textfield-temporary_links_public_storage_ttl")
    ).not.toBeInTheDocument();

    await act(async () => {
      await user.click(
        screen.getByRole("checkbox", {
          name: "media_upload.use_temporary_links_on_public_storage"
        })
      );
    });

    expect(
      screen.getByTestId("textfield-temporary_links_public_storage_ttl")
    ).toBeInTheDocument();
  });

  it("disables the save button while saving and re-enables after resolve", async () => {
    let resolveSave;
    onSave = jest.fn(
      () =>
        new Promise((res) => {
          resolveSave = res;
        })
    );
    const user = userEvent.setup();
    renderDialog({ ...BASE_ENTITY, name: "Slides", max_size: 1024 });

    const saveButton = screen.getByText("general.save").closest("button");
    expect(saveButton).not.toBeDisabled();

    await act(async () => {
      await user.click(saveButton);
    });

    expect(saveButton).toBeDisabled();

    await act(async () => {
      resolveSave();
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
  });

  it("keeps the dialog open and re-enables save when onSave rejects", async () => {
    onSave = jest.fn(() => Promise.reject(new Error("server error")));
    const user = userEvent.setup();
    renderDialog({ ...BASE_ENTITY, name: "Slides", max_size: 1024 });

    const saveButton = screen.getByText("general.save").closest("button");

    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the close icon is clicked and not saving", async () => {
    const user = userEvent.setup();
    renderDialog();

    await act(async () => {
      await user.click(screen.getByLabelText("close"));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("Yup validation", () => {
    it("blocks submit and shows a required error when name is empty", async () => {
      const user = userEvent.setup();
      renderDialog({ ...BASE_ENTITY, name: "", max_size: 1024 });

      await act(async () => {
        await user.click(screen.getByText("general.save").closest("button"));
      });

      expect(
        screen.getByTestId("textfield-name").nextSibling
      ).toHaveTextContent("validation.required");
      expect(onSave).not.toHaveBeenCalled();
    });

    it("blocks submit and shows a required error when max_size is cleared to empty", async () => {
      const user = userEvent.setup();
      renderDialog({ ...BASE_ENTITY, name: "Slides", max_size: 1024 });

      const maxSizeInput = screen.getByTestId("filesize-max_size");
      await act(async () => {
        await user.clear(maxSizeInput);
        await user.click(screen.getByText("general.save").closest("button"));
      });

      expect(
        screen.getByTestId("filesize-max_size").nextSibling
      ).toHaveTextContent("validation.required");
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it("renders an inline error for a field when the errors prop is populated", () => {
    renderDialog(
      { ...BASE_ENTITY, name: "Slides", max_size: 1024 },
      { name: "Name already in use" }
    );

    expect(screen.getByText("Name already in use")).toBeInTheDocument();
  });

  it("clears a stale server-side error once the user edits the field", async () => {
    renderDialog(
      { ...BASE_ENTITY, name: "Slides", max_size: 1024 },
      { name: "Name already in use" }
    );

    expect(screen.getByText("Name already in use")).toBeInTheDocument();

    const nameInput = screen.getByTestId("textfield-name");
    fireEvent.change(nameInput, { target: { value: "New Slides" } });

    await waitFor(() =>
      expect(screen.queryByText("Name already in use")).not.toBeInTheDocument()
    );
  });

  describe("presentation_types", () => {
    it("shows pre-selected presentation types as chips when editing an existing entity", () => {
      renderDialog({
        ...BASE_ENTITY,
        id: 7,
        name: "Slides",
        max_size: 1024,
        presentation_types: [1, 2]
      });

      expect(screen.getByText("Talk")).toBeInTheDocument();
      expect(screen.getByText("Panel")).toBeInTheDocument();
      expect(screen.queryByText("Keynote")).not.toBeInTheDocument();
    });

    it("adds the selected presentation type id and submits it on save", async () => {
      const user = userEvent.setup();
      renderDialog({ ...BASE_ENTITY, name: "Slides", max_size: 1024 });

      const combobox = screen.getByRole("combobox", {
        name: "media_upload.presentation_types"
      });

      await act(async () => {
        await user.click(combobox);
      });

      await act(async () => {
        await user.click(screen.getByText("Talk"));
      });

      await act(async () => {
        await user.click(screen.getByText("general.save").closest("button"));
      });

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ presentation_types: [1] })
      );
    });
  });
});
