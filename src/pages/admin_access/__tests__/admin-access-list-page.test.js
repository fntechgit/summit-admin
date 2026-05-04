import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter, Route } from "react-router-dom";
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
  const MockMuiTable = ({
    data = [],
    onEdit,
    onDelete,
    onPerPageChange,
    onSort
  }) => (
    <div data-testid="mui-table">
      <button type="button" onClick={() => onPerPageChange(25)}>
        per-page-25
      </button>
      <button type="button" onClick={() => onSort("title", -1)}>
        sort-col
      </button>
      {data.map((row) => (
        <div key={row.id} data-testid={`row-${row.id}`}>
          <span>{row.title}</span>
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

jest.mock("../../../components/forms/admin-access-form", () => {
  const MockAdminAccessForm = ({ onSubmit, isSaving }) => (
    <div data-testid="admin-access-form">
      <button
        type="button"
        onClick={() => onSubmit({ title: "Group A", members: [], summits: [] })}
        disabled={isSaving}
      >
        submit-form
      </button>
    </div>
  );

  return MockAdminAccessForm;
});

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const baseListState = {
  admin_accesses: [
    { id: 1, title: "Group A", members: "John Doe", summits: "Summit One" }
  ],
  totalAdminAccesses: 1,
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

describe("AdminAccessListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAdminAccesses.mockReturnValue(() => Promise.resolve());
    mockDeleteAdminAccess.mockReturnValue(() => Promise.resolve());
    mockGetAdminAccess.mockReturnValue(() => Promise.resolve());
    mockResetAdminAccessForm.mockReturnValue(() => Promise.resolve());
    mockSaveAdminAccess.mockReturnValue(() => Promise.resolve());
  });

  describe("rendering and navigation", () => {
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

    it("requests data with new sort column and direction", async () => {
      renderPage("/app/admin-access");

      fireEvent.click(screen.getByRole("button", { name: "sort-col" }));

      await waitFor(() => {
        expect(mockGetAdminAccesses).toHaveBeenCalledWith(
          "",
          1,
          10,
          "title",
          -1
        );
      });
    });

    it("requests data with search term and resets to page 1", async () => {
      renderPage("/app/admin-access");

      fireEvent.change(screen.getByPlaceholderText("search"), {
        target: { value: "admins" }
      });

      await waitFor(() => {
        expect(mockGetAdminAccesses).toHaveBeenCalledWith(
          "admins",
          1,
          10,
          "id",
          1
        );
      });
    });
  });

  describe("save guard", () => {
    it("disables the X button and submit while save is in flight", async () => {
      mockSaveAdminAccess.mockReturnValue(() => new Promise(() => {}));

      renderPage("/app/admin-access/new");
      await waitFor(() =>
        expect(screen.getByTestId("admin-access-form")).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole("button", { name: "submit-form" }));

      await waitFor(() => {
        expect(
          screen.getByTestId("CloseIcon").closest("button")
        ).toBeDisabled();
        expect(
          screen.getByRole("button", { name: "submit-form" })
        ).toBeDisabled();
      });
    });

    it("keeps dialog open, re-enables buttons, and does not reload list when save rejects", async () => {
      mockSaveAdminAccess.mockReturnValue(() =>
        Promise.reject(new Error("save failed"))
      );

      renderPage("/app/admin-access/new");
      await waitFor(() =>
        expect(screen.getByTestId("admin-access-form")).toBeInTheDocument()
      );

      const callsBefore = mockGetAdminAccesses.mock.calls.length;

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "submit-form" }));
        await flushPromises();
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("CloseIcon").closest("button")
        ).not.toBeDisabled();
      });

      expect(screen.getByTestId("admin-access-form")).toBeInTheDocument();
      expect(mockGetAdminAccesses.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("route-driven open/close", () => {
    it("does not open dialog and navigates back when getAdminAccess rejects", async () => {
      mockGetAdminAccess.mockReturnValue(() =>
        Promise.reject(new Error("not found"))
      );

      renderPage("/app/admin-access/1");

      await act(async () => {
        await flushPromises();
      });

      expect(screen.queryByTestId("admin-access-form")).not.toBeInTheDocument();
    });

    it("closes the dialog when the URL changes from a detail route to the list route", async () => {
      const store = mockStore({
        adminAccessListState: baseListState,
        adminAccessState: {
          entity: { id: 1, title: "Group A", members: [], summits: [] },
          errors: {}
        }
      });

      let capturedHistory;

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={["/app/admin-access/1"]}>
            <>
              <Route
                path="/app/admin-access/:access_id?"
                component={AdminAccessListPage}
              />
              <Route
                render={({ history }) => {
                  capturedHistory = history;
                  return null;
                }}
              />
            </>
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() =>
        expect(screen.getByTestId("admin-access-form")).toBeInTheDocument()
      );

      await act(async () => {
        capturedHistory.push("/app/admin-access");
        await flushPromises();
      });

      await waitFor(() =>
        expect(
          screen.queryByTestId("admin-access-form")
        ).not.toBeInTheDocument()
      );
    });
  });

  describe("list management", () => {
    it("reloads the list after a successful save", async () => {
      renderPage("/app/admin-access/new");
      await waitFor(() =>
        expect(screen.getByTestId("admin-access-form")).toBeInTheDocument()
      );

      const callsBefore = mockGetAdminAccesses.mock.calls.length;

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "submit-form" }));
        await flushPromises();
      });

      expect(mockGetAdminAccesses.mock.calls.length).toBeGreaterThan(
        callsBefore
      );
    });

    it("reloads the list after a successful delete", async () => {
      renderPage("/app/admin-access");

      const callsBefore = mockGetAdminAccesses.mock.calls.length;

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "delete" }));
        await flushPromises();
      });

      expect(mockGetAdminAccesses.mock.calls.length).toBeGreaterThan(
        callsBefore
      );
    });

    it("re-syncs the list after a failed delete", async () => {
      mockDeleteAdminAccess.mockReturnValue(() =>
        Promise.reject(new Error("delete failed"))
      );

      renderPage("/app/admin-access");

      const callsBefore = mockGetAdminAccesses.mock.calls.length;

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "delete" }));
        await flushPromises();
      });

      // .finally() fires even on rejection
      expect(mockGetAdminAccesses.mock.calls.length).toBeGreaterThan(
        callsBefore
      );
    });

    it("decrements page when deleting the last item on a page > 1", async () => {
      const store = mockStore({
        adminAccessListState: {
          ...baseListState,
          currentPage: 2,
          admin_accesses: [{ id: 1, title: "Group A" }]
        },
        adminAccessState: baseFormState
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={["/app/admin-access"]}>
            <Route
              path="/app/admin-access/:access_id?"
              component={AdminAccessListPage}
            />
          </MemoryRouter>
        </Provider>
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "delete" }));
        await flushPromises();
      });

      const lastCall =
        mockGetAdminAccesses.mock.calls[
          mockGetAdminAccesses.mock.calls.length - 1
        ];
      expect(lastCall[1]).toBe(1);
    });
  });
});
