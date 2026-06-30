import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import TaxTypeListPage from "../tax-type-list-page";
import {
  getTaxTypes,
  deleteTaxType,
  getTaxType,
  saveTaxType,
  resetTaxTypeForm,
  addTicketToTaxType,
  removeTicketFromTaxType
} from "../../../actions/tax-actions";

jest.mock("../../../actions/tax-actions", () => ({
  getTaxTypes: jest.fn(),
  deleteTaxType: jest.fn(),
  getTaxType: jest.fn(),
  saveTaxType: jest.fn(),
  resetTaxTypeForm: jest.fn(),
  addTicketToTaxType: jest.fn(),
  removeTicketFromTaxType: jest.fn()
}));

jest.mock("../../../routes/restrict", () => ({
  __esModule: true,
  default: (WrappedComponent) => WrappedComponent
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }) => (
    <div>
      <button
        type="button"
        onClick={() => onEdit({ id: 1, name: "VAT", rate: 20, tax_id: "V1" })}
      >
        edit-row
      </button>
      <button type="button" onClick={() => onDelete(1)}>
        delete-row
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: () => <input placeholder="search-tax-types" />
  })
);

jest.mock("../popup/tax-type-popup", () => ({
  __esModule: true,
  default: ({ onSave, onClose }) => (
    <div data-testid="tax-type-popup">
      <button
        type="button"
        onClick={() => onSave({ name: "New Tax", rate: 10, tax_id: "NT1" })}
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
  currentSummitState: {
    currentSummit: { id: 1 }
  },
  currentTaxTypeListState: {
    taxTypes: [{ id: 1, name: "VAT", rate: 20, tax_id: "V1" }],
    totalTaxTypes: 1,
    perPage: 10,
    currentPage: 1,
    term: "",
    order: "name",
    orderDir: 1
  },
  currentTaxTypeState: {
    entity: { id: 0, name: "", rate: "", tax_id: "", ticket_types: [] },
    errors: {}
  }
};

describe("TaxTypeListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTaxTypes.mockReturnValue(() => Promise.resolve());
    deleteTaxType.mockReturnValue(() => Promise.resolve());
    saveTaxType.mockReturnValue(() => Promise.resolve());
    getTaxType.mockReturnValue(() => Promise.resolve());
    resetTaxTypeForm.mockReturnValue({ type: "RESET_TAX_TYPE_FORM" });
    addTicketToTaxType.mockReturnValue(() => Promise.resolve());
    removeTicketFromTaxType.mockReturnValue(() => Promise.resolve());
  });

  it("reloads the list after a successful save", async () => {
    renderWithRedux(<TaxTypeListPage match={{ url: "/taxes" }} />, {
      initialState
    });

    await userEvent.click(
      screen.getByRole("button", { name: "tax_type_list.add_tax_type" })
    );
    expect(screen.getByTestId("tax-type-popup")).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "popup-save" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleSave .then()
    expect(getTaxTypes).toHaveBeenCalledTimes(2);
  });

  it("reloads the list after a successful delete", async () => {
    renderWithRedux(<TaxTypeListPage match={{ url: "/taxes" }} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDelete .finally()
    expect(getTaxTypes).toHaveBeenCalledTimes(2);
  });

  it("closes popup and resets form when popup calls onClose", async () => {
    renderWithRedux(<TaxTypeListPage match={{ url: "/taxes" }} />, {
      initialState
    });

    await userEvent.click(
      screen.getByRole("button", { name: "tax_type_list.add_tax_type" })
    );
    expect(screen.getByTestId("tax-type-popup")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "popup-close" }));

    expect(screen.queryByTestId("tax-type-popup")).not.toBeInTheDocument();
    expect(resetTaxTypeForm).toHaveBeenCalled();
  });

  it("fetches the entity and opens the popup when clicking edit", async () => {
    renderWithRedux(<TaxTypeListPage match={{ url: "/taxes" }} />, {
      initialState
    });

    expect(screen.queryByTestId("tax-type-popup")).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    expect(getTaxType).toHaveBeenCalledWith(1);
    expect(screen.getByTestId("tax-type-popup")).toBeInTheDocument();
  });

  it("re-syncs the list after a failed delete", async () => {
    deleteTaxType.mockReturnValue(() =>
      Promise.reject(new Error("delete failed"))
    );

    renderWithRedux(<TaxTypeListPage match={{ url: "/taxes" }} />, {
      initialState
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    // Call 1: useEffect on mount; call 2: handleDelete .finally() (fires even on rejection)
    expect(getTaxTypes).toHaveBeenCalledTimes(2);
  });
});
