// ---- Mocks must come first ----

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockGetCompany = jest.fn(() => () => Promise.resolve());
const mockResetCompanyForm = jest.fn(() => () => {});
const mockSaveCompany = jest.fn(() => () => Promise.resolve());
const mockAttachLogo = jest.fn(() => () => Promise.resolve());
const mockRemoveLogo = jest.fn(() => () => Promise.resolve());

jest.mock("../../../actions/company-actions", () => ({
  getCompany: (...args) => mockGetCompany(...args),
  resetCompanyForm: (...args) => mockResetCompanyForm(...args),
  saveCompany: (...args) => mockSaveCompany(...args),
  attachLogo: (...args) => mockAttachLogo(...args),
  removeLogo: (...args) => mockRemoveLogo(...args)
}));

const mockGetSponsoredProjects = jest.fn(() => () => Promise.resolve());
const mockSaveSupportingCompany = jest.fn(() => () => Promise.resolve());
const mockDeleteSupportingCompany = jest.fn(() => () => Promise.resolve());

jest.mock("../../../actions/sponsored-project-actions", () => ({
  getSponsoredProjects: (...args) => mockGetSponsoredProjects(...args),
  saveSupportingCompany: (...args) => mockSaveSupportingCompany(...args),
  deleteSupportingCompany: (...args) => mockDeleteSupportingCompany(...args)
}));

// CompanyForm's own fields are covered separately in
// src/components/forms/__tests__/company-form.test.js — mocked here so this
// suite can focus on the page's fetch/save/navigate orchestration.
jest.mock(
  "../../../components/forms/company-form",
  () =>
    function MockCompanyForm({ initialEntity, isSaving }) {
      return (
        <div
          data-testid="company-form"
          data-has-entity={String(!!initialEntity)}
          data-is-saving={String(!!isSaving)}
        />
      );
    }
);

// ---- Now imports ----
/* eslint-disable import/first */
import React from "react";
import { screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditCompanyPage from "../edit-company-page";
import { renderWithRedux } from "../../../utils/test-utils";
/* eslint-enable import/first */

const BASE_ENTITY = {
  id: 0,
  name: "",
  color: "",
  project_sponsorships: []
};

const buildMatch = (companyId) => ({
  params: { company_id: companyId },
  url: companyId ? `/app/companies/${companyId}` : "/app/companies/new"
});

const renderPage = ({
  companyId,
  entity = BASE_ENTITY,
  history = { push: jest.fn() }
} = {}) => {
  const utils = renderWithRedux(
    <EditCompanyPage match={buildMatch(companyId)} history={history} />,
    {
      initialState: {
        currentCompanyState: { entity },
        sponsoredProjectListState: { sponsoredProjects: [] }
      }
    }
  );

  return { ...utils, history };
};

describe("EditCompanyPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCompany.mockReturnValue(() => Promise.resolve());
    mockSaveCompany.mockReturnValue(() => Promise.resolve());
  });

  it("fetches the company when the route has a company id (deep link)", () => {
    renderPage({ companyId: "5" });

    expect(mockGetCompany).toHaveBeenCalledWith("5");
    expect(mockResetCompanyForm).not.toHaveBeenCalled();
  });

  it("resets the form when navigating to the new-company route", () => {
    renderPage({ companyId: undefined });

    expect(mockResetCompanyForm).toHaveBeenCalled();
    expect(mockGetCompany).not.toHaveBeenCalled();
  });

  it("passes the current entity and saving state down to CompanyForm", () => {
    renderPage({
      companyId: "1",
      entity: { ...BASE_ENTITY, id: 1, name: "Acme Corp" }
    });

    const form = screen.getByTestId("company-form");
    expect(form).toHaveAttribute("data-has-entity", "true");
    expect(form).toHaveAttribute("data-is-saving", "false");
  });

  it("saves and navigates back to the company list on success", async () => {
    const user = userEvent.setup();
    const { history } = renderPage({
      companyId: "1",
      entity: { ...BASE_ENTITY, id: 1, name: "Acme Corp" }
    });

    await act(async () => {
      await user.click(screen.getByText("general.save"));
    });

    expect(mockSaveCompany).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: "Acme Corp" })
    );
    await waitFor(() =>
      expect(history.push).toHaveBeenCalledWith("/app/companies")
    );
  });

  it("stays on the page and re-enables Save when saveCompany rejects", async () => {
    mockSaveCompany.mockReturnValue(() =>
      Promise.reject(new Error("server error"))
    );
    const user = userEvent.setup();
    const { history } = renderPage({
      companyId: "1",
      entity: { ...BASE_ENTITY, id: 1, name: "Acme Corp" }
    });

    const saveButton = screen.getByText("general.save").closest("button");

    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => expect(saveButton).not.toBeDisabled());
    expect(history.push).not.toHaveBeenCalled();
  });

  it("disables the Save button while saving and re-enables after resolve", async () => {
    let resolveSave;
    mockSaveCompany.mockReturnValue(
      () =>
        new Promise((res) => {
          resolveSave = res;
        })
    );
    const user = userEvent.setup();
    renderPage({
      companyId: "1",
      entity: { ...BASE_ENTITY, id: 1, name: "Acme Corp" }
    });

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
});
