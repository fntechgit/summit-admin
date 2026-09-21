import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux } from "../../../utils/test-utils";
import RegistrationCompaniesListPage from "../registration-companies-list-page";
import * as registrationCompaniesActions from "../../../actions/registration-companies-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/table",
  () =>
    function MockMuiTable({ data, onDelete }) {
      return (
        <div data-testid="mui-table">
          {data.map((row) => (
            <div key={row.id} data-testid={`row-${row.id}`}>
              {row.name}
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
  "openstack-uicore-foundation/lib/components/inputs/company-input",
  () =>
    function MockCompanyInput({ id, onChange }) {
      return (
        <button
          type="button"
          data-testid="company-input"
          onClick={() =>
            onChange({
              target: { id, value: { id: 99, name: "Acme Co" } }
            })
          }
        >
          pick company
        </button>
      );
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

  it("links an existing company to the summit via CompanyInput + Add, but not when nothing is selected", async () => {
    const user = userEvent.setup();
    renderPage();
    const addButton = screen.getByRole("button", { name: "general.add" });

    await user.click(addButton);
    expect(
      registrationCompaniesActions.addRegistrationCompany
    ).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("company-input"));
    await user.click(addButton);

    expect(
      registrationCompaniesActions.addRegistrationCompany
    ).toHaveBeenCalledWith({ id: 99, name: "Acme Co" });
  });

  it("deletes a company when the table's onDelete callback fires", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByTestId("delete-1"));

    expect(
      registrationCompaniesActions.deleteRegistrationCompany
    ).toHaveBeenCalledWith(1);
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
