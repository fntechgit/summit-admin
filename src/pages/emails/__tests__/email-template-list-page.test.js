import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import EmailTemplateListPage from "../email-template-list-page";
import {
  getEmailTemplates,
  deleteEmailTemplate,
  getEmailTemplate,
  resetTemplateForm,
  saveEmailTemplate,
  getAllClients
} from "../../../actions/email-actions";

jest.mock("../../../actions/email-actions", () => ({
  getEmailTemplates: jest.fn(),
  deleteEmailTemplate: jest.fn(),
  getEmailTemplate: jest.fn(),
  resetTemplateForm: jest.fn(),
  saveEmailTemplate: jest.fn(),
  getAllClients: jest.fn(),
  renderEmailTemplate: jest.fn(),
  updateTemplateJsonData: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }) => (
    <div>
      <button
        type="button"
        onClick={() => onEdit({ id: 1, identifier: "test-template" })}
      >
        edit-row
      </button>
      <button
        type="button"
        onClick={() => onDelete({ id: 1, identifier: "test-template" })}
      >
        delete-row
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: () => <input placeholder="search-templates" />
  })
);

jest.mock("../edit-email-template-popup", () => ({
  __esModule: true,
  default: ({ onSave, onClose }) => (
    <div data-testid="edit-email-template-popup">
      <button
        type="button"
        onClick={() => onSave({ identifier: "New Template" })}
      >
        popup-save
      </button>
      <button type="button" onClick={onClose}>
        popup-close
      </button>
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const initialState = {
  emailTemplateListState: {
    templates: [
      {
        id: 1,
        identifier: "test-template",
        subject: "Test Subject",
        from_email: "test@example.com"
      }
    ],
    totalTemplates: 1,
    perPage: 10,
    currentPage: 1,
    term: "",
    order: "id",
    orderDir: 1
  },
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

describe("EmailTemplateListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEmailTemplates.mockReturnValue(() => Promise.resolve());
    deleteEmailTemplate.mockReturnValue(() => Promise.resolve());
    saveEmailTemplate.mockReturnValue(() => Promise.resolve());
    getEmailTemplate.mockReturnValue(() => Promise.resolve());
    resetTemplateForm.mockReturnValue({ type: "RESET_TEMPLATE_FORM" });
    getAllClients.mockReturnValue(() => Promise.resolve());
  });

  it("reloads the list after a successful delete", async () => {
    renderWithRedux(<EmailTemplateListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDeleteEmailTemplate .finally()
    expect(getEmailTemplates).toHaveBeenCalledTimes(2);
  });

  it("re-syncs the list after a failed delete", async () => {
    deleteEmailTemplate.mockReturnValue(() =>
      Promise.reject(new Error("delete failed"))
    );

    renderWithRedux(<EmailTemplateListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDeleteEmailTemplate .finally() fires even on rejection
    expect(getEmailTemplates).toHaveBeenCalledTimes(2);
  });

  it("resets the form and opens the popup when adding a new template", async () => {
    renderWithRedux(<EmailTemplateListPage />, { initialState });

    await userEvent.click(
      screen.getByRole("button", { name: "emails.add_template" })
    );

    expect(resetTemplateForm).toHaveBeenCalled();
    expect(getAllClients).toHaveBeenCalled();
    expect(screen.getByTestId("edit-email-template-popup")).toBeInTheDocument();
  });

  it("reloads the list at the first page after a successful create", async () => {
    renderWithRedux(<EmailTemplateListPage />, { initialState });

    await userEvent.click(
      screen.getByRole("button", { name: "emails.add_template" })
    );

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "popup-save" }));
      await flushPromises();
    });

    expect(saveEmailTemplate).toHaveBeenCalledWith({
      identifier: "New Template"
    });
    // Call 1: useEffect on mount; call 2: handleCreate .then()
    expect(getEmailTemplates).toHaveBeenCalledTimes(2);
  });

  it("fetches the entity and opens the popup when clicking edit", async () => {
    renderWithRedux(<EmailTemplateListPage />, { initialState });

    expect(
      screen.queryByTestId("edit-email-template-popup")
    ).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    expect(getEmailTemplate).toHaveBeenCalledWith(1);
    expect(getAllClients).toHaveBeenCalled();
    expect(screen.getByTestId("edit-email-template-popup")).toBeInTheDocument();
  });

  it("closes the popup and resets the form when the popup calls onClose", async () => {
    renderWithRedux(<EmailTemplateListPage />, { initialState });

    await userEvent.click(
      screen.getByRole("button", { name: "emails.add_template" })
    );
    expect(screen.getByTestId("edit-email-template-popup")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "popup-close" }));

    expect(
      screen.queryByTestId("edit-email-template-popup")
    ).not.toBeInTheDocument();
    expect(resetTemplateForm).toHaveBeenCalled();
  });
});
