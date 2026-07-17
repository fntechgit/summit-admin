import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompanyDialog from "../company-dialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  getCountryList: jest.fn((callback) => {
    callback([
      { iso_code: "AR", name: "Argentina" },
      { iso_code: "US", name: "United States" }
    ]);
    return Promise.resolve();
  })
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/upload-input-v3",
  () => ({
    __esModule: true,
    default: ({ id, onUploadComplete, onUploadStart, value }) => (
      <div
        data-testid={`upload-input-${id}`}
        data-logo={value?.[0]?.file_path ?? ""}
      >
        <button
          type="button"
          data-testid={`trigger-upload-${id}`}
          onClick={() => {
            onUploadStart?.();
            onUploadComplete({ path: "/uploads/", name: `${id}.png` });
          }}
        >
          Upload
        </button>
      </div>
    )
  })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/textfield",
  () =>
    function MockTextField({ name }) {
      return <input data-testid={`textfield-${name}`} name={name} />;
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/select",
  () =>
    function MockSelect({ name, children }) {
      return <div data-testid={`select-${name}`}>{children}</div>;
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/table",
  () =>
    function MockTable() {
      return <div data-testid="mui-table" />;
    }
);

jest.mock(
  "../../../../components/inputs/formik-text-editor",
  () =>
    function MockTextEditor({ name }) {
      return <textarea data-testid={`editor-${name}`} name={name} />;
    }
);

jest.mock("../../../../components/mui/showConfirmDialog", () =>
  jest.fn(() => Promise.resolve(true))
);

jest.mock("../../../../hooks/useScrollToError", () => jest.fn());

jest.mock("mui-color-input", () => ({
  MuiColorInput: ({ value, onChange, onBlur, name }) => (
    <input
      data-testid="color-input"
      name={name}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onBlur({ target: { name, value: e.target.value } })}
    />
  )
}));

const BASE_ENTITY = {
  id: 0,
  name: "",
  url: "",
  contact_email: "",
  member_level: "",
  color: "",
  admin_email: "",
  city: "",
  state: "",
  country: "",
  industry: "",
  products: "",
  contributions: "",
  description: "",
  overview: "",
  commitment: "",
  logo: "",
  big_logo: "",
  project_sponsorships: []
};

describe("CompanyDialog", () => {
  let onSave;
  let onClose;

  beforeEach(() => {
    jest.clearAllMocks();
    onSave = jest.fn(() => Promise.resolve());
    onClose = jest.fn();
    window.APP_CLIENT_NAME = "";
  });

  test.each([
    [
      "resolves a stored ISO code to its label when editing",
      { ...BASE_ENTITY, id: 1, name: "Acme Corp", country: "AR" },
      "Argentina"
    ],
    ["leaves the country field empty for a new company", BASE_ENTITY, ""]
  ])("%s", async (_label, entity, expectedValue) => {
    render(<CompanyDialog entity={entity} onSave={onSave} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue(expectedValue);
    });
  });

  it("calls onSave with the ISO country code and then onClose on valid submit", async () => {
    const user = userEvent.setup();

    render(
      <CompanyDialog
        entity={{ ...BASE_ENTITY, id: 1, name: "Acme Corp", country: "AR" }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue("Argentina");
    });

    await act(async () => {
      await user.click(screen.getByText("general.save"));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ country: "AR" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("submits a newly picked color after it is blurred", async () => {
    const user = userEvent.setup();

    render(
      <CompanyDialog
        entity={{ ...BASE_ENTITY, id: 1, name: "Acme Corp", color: "#ff0000" }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const colorInput = screen.getByTestId("color-input");
    fireEvent.change(colorInput, { target: { value: "#00ff00" } });
    fireEvent.blur(colorInput);

    await act(async () => {
      await user.click(screen.getByText("general.save"));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ color: "#00ff00" })
    );
  });

  it("keeps dialog open and re-enables save when onSave rejects", async () => {
    onSave = jest.fn(() => Promise.reject(new Error("server error")));
    const user = userEvent.setup();

    render(
      <CompanyDialog
        entity={{ ...BASE_ENTITY, id: 1, name: "Acme Corp" }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const saveButton = screen.getByText("general.save").closest("button");

    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("disables the save button while saving and re-enables after resolve", async () => {
    let resolve;
    onSave = jest.fn(
      () =>
        new Promise((res) => {
          resolve = res;
        })
    );

    const user = userEvent.setup();

    render(
      <CompanyDialog
        entity={{ ...BASE_ENTITY, id: 1, name: "Acme Corp" }}
        onSave={onSave}
        onClose={onClose}
      />
    );

    const saveButton = screen.getByText("general.save").closest("button");
    expect(saveButton).not.toBeDisabled();

    await act(async () => {
      await user.click(saveButton);
    });

    expect(saveButton).toBeDisabled();

    await act(async () => {
      resolve();
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
  });

  it("calls onClose when the close icon button is clicked and not saving", async () => {
    const user = userEvent.setup();

    render(
      <CompanyDialog entity={BASE_ENTITY} onSave={onSave} onClose={onClose} />
    );

    await act(async () => {
      await user.click(screen.getByLabelText("close"));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("logo upload", () => {
    it("re-enables save after CDN upload completes for a new company", async () => {
      const user = userEvent.setup();
      const onAttach = jest.fn(() => Promise.resolve());
      const onRemove = jest.fn(() => Promise.resolve());

      render(
        <CompanyDialog
          entity={BASE_ENTITY}
          onSave={onSave}
          onClose={onClose}
          onAttach={onAttach}
          onRemove={onRemove}
        />
      );

      const saveButton = screen.getByText("general.save").closest("button");

      await act(async () => {
        await user.click(screen.getByTestId("trigger-upload-big_logo"));
      });

      await waitFor(() => expect(saveButton).not.toBeDisabled());
      expect(onAttach).not.toHaveBeenCalled();
    });

    it("reverts logo preview and re-enables save when onAttach fails", async () => {
      const user = userEvent.setup();
      let rejectAttach;
      const onAttach = jest.fn(
        () =>
          new Promise((_, rej) => {
            rejectAttach = rej;
          })
      );
      const onRemove = jest.fn(() => Promise.resolve());

      render(
        <CompanyDialog
          entity={{
            ...BASE_ENTITY,
            id: 1,
            name: "Acme Corp",
            logo: "old-logo.png"
          }}
          onSave={onSave}
          onClose={onClose}
          onAttach={onAttach}
          onRemove={onRemove}
        />
      );

      const saveButton = screen.getByText("general.save").closest("button");

      // trigger the upload completion (CDN upload already happened)
      await act(async () => {
        await user.click(screen.getByTestId("trigger-upload-logo"));
      });

      // save should be blocked while onAttach is in flight
      expect(saveButton).toBeDisabled();

      // API call fails
      await act(async () => {
        rejectAttach(new Error("network error"));
      });

      // save re-enables and logo preview reverts to the previous value
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      expect(screen.getByTestId("upload-input-logo")).toHaveAttribute(
        "data-logo",
        "old-logo.png"
      );
    });
  });
});
