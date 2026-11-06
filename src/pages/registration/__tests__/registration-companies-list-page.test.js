import React from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import RegistrationCompaniesListPage from "../registration-companies-list-page";
import * as registrationCompaniesActions from "../../../actions/registration-companies-actions";
import { DEFAULT_CURRENT_PAGE } from "../../../utils/constants";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/table",
  () =>
    function MockMuiTable({
      data,
      onDelete,
      onEdit,
      onSort,
      onPageChange,
      onPerPageChange
    }) {
      return (
        <div data-testid="mui-table">
          <button type="button" onClick={() => onSort("name", -1)}>
            sort
          </button>
          <button type="button" onClick={() => onPageChange(2)}>
            page
          </button>
          <button type="button" onClick={() => onPerPageChange(50)}>
            per-page
          </button>
          {data.map((row) => (
            <div key={row.id} data-testid={`row-${row.id}`}>
              {row.name}
              <button
                type="button"
                data-testid={`edit-${row.id}`}
                onClick={() => onEdit(row)}
              >
                Edit
              </button>
              <button
                type="button"
                data-testid={`delete-${row.id}`}
                onClick={() => onDelete(row.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      );
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/company-input",
  () => {
    const { useField } = jest.requireActual("formik");
    return function MockCompanyInput({ name }) {
      const [, , helpers] = useField(name);
      return (
        <button
          type="button"
          data-testid="company-input"
          onClick={() => helpers.setValue({ id: 99, name: "Acme Co" })}
        >
          pick company
        </button>
      );
    };
  }
);

jest.mock(
  "../registration-companies-import-dialog",
  () =>
    function MockImportDialog({ onClose, onImport }) {
      return (
        <div data-testid="import-dialog">
          <button
            type="button"
            data-testid="import-trigger"
            onClick={() => onImport(new FormData()).then(onClose)}
          >
            Ingest
          </button>
        </div>
      );
    }
);

jest.mock("../../../actions/registration-companies-actions", () => {
  const original = jest.requireActual(
    "../../../actions/registration-companies-actions"
  );
  return {
    __esModule: true,
    ...original,
    getRegistrationCompanies: jest.fn(() => () => Promise.resolve()),
    addRegistrationCompany: jest.fn(() => () => Promise.resolve()),
    deleteRegistrationCompany: jest.fn(() => () => Promise.resolve()),
    importRegistrationCompaniesCSV: jest.fn(() => () => Promise.resolve())
  };
});

const COMPANIES = [
  { id: 1, name: "Company One" },
  { id: 2, name: "Company Two" }
];

const buildState = (listOverrides = {}) => ({
  currentSummitState: {
    currentSummit: { id: 73 }
  },
  currentRegistrationCompanyListState: {
    companies: COMPANIES,
    term: null,
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalCompanies: 2,
    ...listOverrides
  }
});

describe("RegistrationCompaniesListPage", () => {
  const renderPage = (stateOverrides = {}, historyOverrides = {}) =>
    renderWithRedux(
      <RegistrationCompaniesListPage
        history={{ push: jest.fn(), ...historyOverrides }}
      />,
      { initialState: buildState(stateOverrides) }
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls getRegistrationCompanies on mount when the summit is loaded", () => {
    renderPage();
    expect(
      registrationCompaniesActions.getRegistrationCompanies
    ).toHaveBeenCalledTimes(1);
  });

  it("adds the selected company and refreshes the table, but not when nothing is selected", async () => {
    const user = userEvent.setup();
    renderPage({ term: "foo", order: "name", orderDir: -1, perPage: 20 });
    const { addRegistrationCompany, getRegistrationCompanies } =
      registrationCompaniesActions;
    getRegistrationCompanies.mockClear();
    const addButton = screen.getByRole("button", { name: "general.add" });

    await user.click(addButton);
    expect(addRegistrationCompany).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("company-input"));
    await user.click(addButton);

    await waitFor(() =>
      expect(getRegistrationCompanies).toHaveBeenCalledWith(
        "foo",
        DEFAULT_CURRENT_PAGE,
        20,
        "name",
        -1
      )
    );
    expect(addRegistrationCompany).toHaveBeenCalledWith({
      id: 99,
      name: "Acme Co"
    });
  });

  it("refetches with the current list params on search, sort, page and per-page changes", async () => {
    const user = userEvent.setup();
    renderPage({ term: "foo", order: "name", orderDir: 1, perPage: 20 });
    const { getRegistrationCompanies } = registrationCompaniesActions;
    getRegistrationCompanies.mockClear();

    const search = screen.getByPlaceholderText(
      "registration_companies.placeholders.search_companies"
    );
    await user.clear(search);
    await user.type(search, "acme{Enter}");
    await user.click(screen.getByRole("button", { name: "sort" }));
    await user.click(screen.getByRole("button", { name: "page" }));
    await user.click(screen.getByRole("button", { name: "per-page" }));

    expect(getRegistrationCompanies.mock.calls).toEqual([
      ["acme", DEFAULT_CURRENT_PAGE, 20, "name", 1],
      ["foo", DEFAULT_CURRENT_PAGE, 20, "name", -1],
      ["foo", 2, 20, "name", 1],
      ["foo", DEFAULT_CURRENT_PAGE, 50, "name", 1]
    ]);
  });

  it("navigates on edit, and refreshes the table only after a successful delete", async () => {
    const user = userEvent.setup();
    const push = jest.fn();
    renderPage(
      { term: "foo", order: "name", orderDir: -1, perPage: 20 },
      { push }
    );
    const { deleteRegistrationCompany, getRegistrationCompanies } =
      registrationCompaniesActions;
    getRegistrationCompanies.mockClear();

    await user.click(screen.getByTestId("edit-1"));
    expect(push).toHaveBeenCalledWith("/app/companies/1");

    deleteRegistrationCompany.mockImplementationOnce(
      () => () => Promise.reject(new Error("failed"))
    );
    await user.click(screen.getByTestId("delete-1"));
    expect(getRegistrationCompanies).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("delete-1"));
    expect(deleteRegistrationCompany).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(getRegistrationCompanies.mock.calls).toEqual([
        ["foo", DEFAULT_CURRENT_PAGE, 20, "name", -1]
      ])
    );
  });

  it("opens the import dialog and closes it after a successful import", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByTestId("import-dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "registration_companies.import" })
    );
    expect(screen.getByTestId("import-dialog")).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByTestId("import-trigger"));
    });

    expect(
      registrationCompaniesActions.importRegistrationCompaniesCSV
    ).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("import-dialog")).not.toBeInTheDocument();
  });
});
