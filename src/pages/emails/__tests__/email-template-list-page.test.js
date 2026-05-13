import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import EmailTemplateListPage from "../email-template-list-page";
import {
  getEmailTemplates,
  deleteEmailTemplate
} from "../../../actions/email-actions";

jest.mock("../../../actions/email-actions", () => ({
  getEmailTemplates: jest.fn(),
  deleteEmailTemplate: jest.fn()
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

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { push: jest.fn() };

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
  }
};

describe("EmailTemplateListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEmailTemplates.mockReturnValue(() => Promise.resolve());
    deleteEmailTemplate.mockReturnValue(() => Promise.resolve());
  });

  it("reloads the list after a successful delete", async () => {
    renderWithRedux(<EmailTemplateListPage history={mockHistory} />, {
      initialState
    });

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

    renderWithRedux(<EmailTemplateListPage history={mockHistory} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDeleteEmailTemplate .finally() fires even on rejection
    expect(getEmailTemplates).toHaveBeenCalledTimes(2);
  });
});
