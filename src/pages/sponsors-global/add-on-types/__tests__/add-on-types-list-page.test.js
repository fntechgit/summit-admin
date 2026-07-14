import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor
} from "@testing-library/react";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import AddOnTypesListPage from "../add-on-types-list-page";
import AddOnTypesDialog from "../add-on-types-dialog";

const mockGetAddOnTypes = jest.fn();
const mockGetAddOnType = jest.fn();
const mockResetAddOnTypeForm = jest.fn();
const mockSaveAddOnType = jest.fn();
const mockDeleteAddOnType = jest.fn();

jest.mock("../../../../actions/add-on-types-actions", () => ({
  getAddOnTypes: (...args) => mockGetAddOnTypes(...args),
  getAddOnType: (...args) => mockGetAddOnType(...args),
  resetAddOnTypeForm: (...args) => mockResetAddOnTypeForm(...args),
  saveAddOnType: (...args) => mockSaveAddOnType(...args),
  deleteAddOnType: (...args) => mockDeleteAddOnType(...args)
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => {
  const MockMuiTable = ({ data = [], onEdit, onDelete }) => (
    <div data-testid="mui-table">
      {data.map((row) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          <button type="button" onClick={() => onEdit(row)}>
            edit
          </button>
          <button type="button" onClick={() => onDelete(row.id)}>
            delete
          </button>
        </div>
      ))}
    </div>
  );
  return MockMuiTable;
});

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <input placeholder="search" onChange={(e) => onSearch(e.target.value)} />
    )
  })
);

jest.mock("../add-on-types-dialog", () => {
  const MockDialog = ({ onSave, onClose }) => (
    <div data-testid="add-on-types-dialog">
      <button
        type="button"
        onClick={() => {
          MockDialog.lastSaveResult = onSave({ name: "New Type" });
        }}
      >
        submit-form
      </button>
      <button type="button" onClick={onClose} aria-label="close">
        close
      </button>
    </div>
  );
  return MockDialog;
});

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const baseState = {
  currentAddOnTypesListState: {
    addOnTypes: [{ id: 1, name: "Early Bird" }],
    totalAddOnTypes: 1,
    term: "",
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10
  },
  currentAddOnTypeState: { entity: { id: 0, name: "" }, errors: {} },
  loggedUserState: { member: { groups: [{ code: "super-admins" }] } }
};

const renderPage = (stateOverride = {}) => {
  const store = mockStore({ ...baseState, ...stateOverride });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <AddOnTypesListPage match={{ url: "/app/add-on-types" }} />
      </MemoryRouter>
    </Provider>
  );
  return store;
};

describe("AddOnTypesListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAddOnTypes.mockReturnValue(() => Promise.resolve());
    mockGetAddOnType.mockReturnValue(() => Promise.resolve());
    mockResetAddOnTypeForm.mockReturnValue(() => Promise.resolve());
    mockSaveAddOnType.mockReturnValue(() => Promise.resolve());
    mockDeleteAddOnType.mockReturnValue(() => Promise.resolve());
  });

  it("renders the table and fetches data on mount", () => {
    renderPage();
    expect(screen.getByTestId("mui-table")).toBeInTheDocument();
    expect(mockGetAddOnTypes).toHaveBeenCalled();
  });

  it("shows no-results message when list is empty", () => {
    renderPage({
      currentAddOnTypesListState: {
        ...baseState.currentAddOnTypesListState,
        addOnTypes: [],
        totalAddOnTypes: 0
      }
    });
    expect(
      screen.getByText("add_on_types_list.no_results")
    ).toBeInTheDocument();
  });

  it("resets form and opens dialog when Add button is clicked", async () => {
    renderPage();
    fireEvent.click(
      screen.getByRole("button", {
        name: /add_on_types_list\.add_add_on_type/i
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId("add-on-types-dialog")).toBeInTheDocument()
    );
    expect(mockResetAddOnTypeForm).toHaveBeenCalled();
  });

  it("fetches the item and opens dialog when edit is clicked", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "edit" }));
    await waitFor(() =>
      expect(screen.getByTestId("add-on-types-dialog")).toBeInTheDocument()
    );
    expect(mockGetAddOnType).toHaveBeenCalledWith(1);
  });

  it("reloads the list from page 1 after a successful save", async () => {
    renderPage({
      currentAddOnTypesListState: {
        ...baseState.currentAddOnTypesListState,
        currentPage: 3
      }
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /add_on_types_list\.add_add_on_type/i
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId("add-on-types-dialog")).toBeInTheDocument()
    );

    const callsBefore = mockGetAddOnTypes.mock.calls.length;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "submit-form" }));
      await flushPromises();
    });

    expect(mockGetAddOnTypes.mock.calls.length).toBeGreaterThan(callsBefore);
    const lastArgs = mockGetAddOnTypes.mock.calls.at(-1);
    expect(lastArgs[1]).toBe(1);
  });

  it("resolves the save handler when the follow-up list refresh fails, so the dialog can still close", async () => {
    mockGetAddOnTypes
      .mockReturnValueOnce(() => Promise.resolve()) // initial mount fetch
      .mockReturnValueOnce(() => Promise.reject(new Error("refresh failed"))); // post-save refresh

    renderPage();
    fireEvent.click(
      screen.getByRole("button", {
        name: /add_on_types_list\.add_add_on_type/i
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId("add-on-types-dialog")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "submit-form" }));

    await expect(AddOnTypesDialog.lastSaveResult).resolves.toBeUndefined();
  });

  it("reloads the list from page 1 after a successful delete", async () => {
    renderPage({
      currentAddOnTypesListState: {
        ...baseState.currentAddOnTypesListState,
        currentPage: 3
      }
    });

    const callsBefore = mockGetAddOnTypes.mock.calls.length;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "delete" }));
      await flushPromises();
    });

    expect(mockGetAddOnTypes.mock.calls.length).toBeGreaterThan(callsBefore);
    const lastArgs = mockGetAddOnTypes.mock.calls.at(-1);
    expect(lastArgs[1]).toBe(1);
  });

  it("closes dialog and resets form when close is clicked", async () => {
    renderPage();
    fireEvent.click(
      screen.getByRole("button", {
        name: /add_on_types_list\.add_add_on_type/i
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId("add-on-types-dialog")).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    await waitFor(() =>
      expect(
        screen.queryByTestId("add-on-types-dialog")
      ).not.toBeInTheDocument()
    );
    expect(mockResetAddOnTypeForm).toHaveBeenCalled();
  });
});
