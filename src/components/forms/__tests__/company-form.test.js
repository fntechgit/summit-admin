// ---- Mocks must come first ----

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
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
        data-logo={value?.[0]?.file_url ?? ""}
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
    // eslint-disable-next-line react/prop-types
    function MockTable({ data, onDelete }) {
      return (
        <div data-testid="mui-table">
          {data.map((row) => (
            <button key={row.id} type="button" onClick={() => onDelete(row.id)}>
              {`delete-${row.id}`}
            </button>
          ))}
        </div>
      );
    }
);

jest.mock(
  "../../inputs/formik-text-editor",
  () =>
    function MockTextEditor({ name }) {
      return <textarea data-testid={`editor-${name}`} name={name} />;
    }
);

jest.mock("../../mui/showConfirmDialog", () =>
  jest.fn(() => Promise.resolve(true))
);

jest.mock("../../../hooks/useScrollToError", () => jest.fn());

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

// ---- Now imports ----
/* eslint-disable import/first */
import React, { useState } from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormikProvider, useFormik } from "formik";
import CompanyForm from "../company-form";
import showConfirmDialog from "../../mui/showConfirmDialog";
/* eslint-enable import/first */

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

// Mirrors the formik wiring edit-company-page.js provides in production, so
// CompanyForm's useFormikContext() has a real context to read from.
const Harness = ({
  initialEntity,
  onAttach = jest.fn(() => Promise.resolve()),
  onRemove = jest.fn(() => Promise.resolve()),
  onAddSponsorship,
  onDeleteSponsorship
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const formik = useFormik({ initialValues: { ...initialEntity } });

  return (
    <FormikProvider value={formik}>
      <CompanyForm
        initialEntity={initialEntity}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        onAttach={onAttach}
        onRemove={onRemove}
        onAddSponsorship={onAddSponsorship}
        onDeleteSponsorship={onDeleteSponsorship}
      />
      <pre data-testid="debug-values">{JSON.stringify(formik.values)}</pre>
    </FormikProvider>
  );
};

const readFormikValues = () =>
  JSON.parse(screen.getByTestId("debug-values").textContent);

describe("CompanyForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    render(<Harness initialEntity={entity} />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue(expectedValue);
    });
  });

  it("stores the full country option (not just the ISO string) once resolved", async () => {
    render(
      <Harness
        initialEntity={{
          ...BASE_ENTITY,
          id: 1,
          name: "Acme Corp",
          country: "AR"
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toHaveValue("Argentina");
    });

    expect(readFormikValues().country).toEqual({
      value: "AR",
      label: "Argentina"
    });
  });

  it("commits a newly picked color into the form on blur", async () => {
    render(
      <Harness
        initialEntity={{
          ...BASE_ENTITY,
          id: 1,
          name: "Acme Corp",
          color: "#ff0000"
        }}
      />
    );

    const colorInput = screen.getByTestId("color-input");
    fireEvent.change(colorInput, { target: { value: "#00ff00" } });
    fireEvent.blur(colorInput);

    await waitFor(() => {
      expect(readFormikValues().color).toBe("#00ff00");
    });
  });

  describe("logo upload", () => {
    it("does not attach to the backend for a new (unsaved) company", async () => {
      const user = userEvent.setup();
      const onAttach = jest.fn(() => Promise.resolve());
      const onRemove = jest.fn(() => Promise.resolve());

      render(
        <Harness
          initialEntity={BASE_ENTITY}
          onAttach={onAttach}
          onRemove={onRemove}
        />
      );

      await act(async () => {
        await user.click(screen.getByTestId("trigger-upload-big_logo"));
      });

      expect(onAttach).not.toHaveBeenCalled();
    });

    it("reverts the logo preview when onAttach fails for an existing company", async () => {
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
        <Harness
          initialEntity={{
            ...BASE_ENTITY,
            id: 1,
            name: "Acme Corp",
            logo: "old-logo.png"
          }}
          onAttach={onAttach}
          onRemove={onRemove}
        />
      );

      await act(async () => {
        await user.click(screen.getByTestId("trigger-upload-logo"));
      });

      expect(screen.getByTestId("upload-input-logo")).toHaveAttribute(
        "data-logo",
        "/uploads/logo.png"
      );

      await act(async () => {
        rejectAttach(new Error("network error"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("upload-input-logo")).toHaveAttribute(
          "data-logo",
          "old-logo.png"
        )
      );
    });
  });

  describe("sponsorship deletion", () => {
    const entityWithSponsorship = {
      ...BASE_ENTITY,
      id: 5,
      name: "Acme Corp",
      project_sponsorships: [
        {
          id: 10,
          sponsored_project: { id: 1, name: "Project A" },
          name: "Gold",
          supporting_companies: [{ id: 99, company_id: 5 }]
        }
      ]
    };

    beforeEach(() => {
      window.APP_CLIENT_NAME = "openstack";
    });

    it("deletes the sponsorship when the user confirms", async () => {
      showConfirmDialog.mockResolvedValueOnce(true);
      const onDeleteSponsorship = jest.fn(() => Promise.resolve());
      const user = userEvent.setup();

      render(
        <Harness
          initialEntity={entityWithSponsorship}
          onDeleteSponsorship={onDeleteSponsorship}
        />
      );

      await user.click(screen.getByText("delete-10"));

      await waitFor(() => {
        expect(onDeleteSponsorship).toHaveBeenCalledWith(1, 10, 99);
      });
    });

    it("does not delete the sponsorship when the user declines", async () => {
      showConfirmDialog.mockResolvedValueOnce(false);
      const onDeleteSponsorship = jest.fn(() => Promise.resolve());
      const user = userEvent.setup();

      render(
        <Harness
          initialEntity={entityWithSponsorship}
          onDeleteSponsorship={onDeleteSponsorship}
        />
      );

      await user.click(screen.getByText("delete-10"));

      await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
      expect(onDeleteSponsorship).not.toHaveBeenCalled();
    });
  });
});
