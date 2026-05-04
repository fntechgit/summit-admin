import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import AdminAccessListPage from "../admin-access-list-page";

const mockGetAdminAccesses = jest.fn(() => () => Promise.resolve());
const mockDeleteAdminAccess = jest.fn(() => () => Promise.resolve());
const mockGetAdminAccess = jest.fn(() => () => Promise.resolve());
const mockResetAdminAccessForm = jest.fn(() => () => Promise.resolve());
const mockSaveAdminAccess = jest.fn(() => () => Promise.resolve());

jest.mock("../../../actions/admin-access-actions", () => ({
  getAdminAccesses: (...args) => mockGetAdminAccesses(...args),
  deleteAdminAccess: (...args) => mockDeleteAdminAccess(...args),
  getAdminAccess: (...args) => mockGetAdminAccess(...args),
  resetAdminAccessForm: (...args) => mockResetAdminAccessForm(...args),
  saveAdminAccess: (...args) => mockSaveAdminAccess(...args)
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => {
  const MockMuiTable = ({ data = [], onEdit, onDelete, onPerPageChange }) => (
    <div data-testid="mui-table">
      <button type="button" onClick={() => onPerPageChange(25)}>
        per-page-25
      </button>
      {data.map((row) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          <span>{row.title}</span>
          <button type="button" onClick={() => onEdit(row)}>
            edit
          </button>
          <button type="button" onClick={() => onDelete(row)}>
            delete
          </button>
        </div>
      ))}
    </div>
  );

  return MockMuiTable;
});

jest.mock("../../../components/forms/admin-access-form", () => {
  const MockAdminAccessForm = ({ onSubmit }) => (
    <div data-testid="admin-access-form">
      <button
        type="button"
        onClick={() => onSubmit({ title: "Group A", members: [], summits: [] })}
      >
        submit-form
      </button>
    </div>
  );

  return MockAdminAccessForm;
});

jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ value: true }))
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const baseListState = {
  admin_accesses: [
    { id: 1, title: "Group A", members: "John Doe", summits: "Summit One" }
  ],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10
};

const baseFormState = {
  entity: { id: 0, title: "", members: [], summits: [] },
  errors: {}
};

const renderPage = (path = "/app/admin-access", formState = baseFormState) => {
  const store = mockStore({
    adminAccessListState: baseListState,
    adminAccessState: formState
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Route
          path="/app/admin-access/:access_id?"
          component={AdminAccessListPage}
        />
      </MemoryRouter>
    </Provider>
  );

  return store;
};

describe("AdminAccessListPage MUI migration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders grid and opens popup for new item", async () => {
    renderPage("/app/admin-access");

    expect(screen.getByTestId("mui-table")).toBeInTheDocument();
    expect(screen.queryByTestId("admin-access-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /create|add/i }));

    await waitFor(() => {
      expect(screen.getByTestId("admin-access-form")).toBeInTheDocument();
    });
  });

  it("opens popup when route has an access id", async () => {
    const formState = {
      entity: { id: 1, title: "Group A", members: [], summits: [] },
      errors: {}
    };

    renderPage("/app/admin-access/1", formState);

    await waitFor(() => {
      expect(screen.getByTestId("admin-access-form")).toBeInTheDocument();
    });
  });

  it("requests data with selected rows per page", async () => {
    renderPage("/app/admin-access");

    fireEvent.click(screen.getByRole("button", { name: "per-page-25" }));

    await waitFor(() => {
      expect(mockGetAdminAccesses).toHaveBeenCalledWith("", 1, 25, "id", 1);
    });
  });
});
