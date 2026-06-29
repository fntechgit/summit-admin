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
    onPageChange,
    onPerPageChange,
    onSort
  }) => (
    <div data-testid="mui-table">
      <button type="button" onClick={() => onPageChange(2)}>
        page-2
      </button>
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

const renderPage = (listState = baseListState, formState = baseFormState) => {
  const store = mockStore({
    adminAccessListState: listState,
    adminAccessState: formState
  });

  render(
    <Provider store={store}>
      <MemoryRouter>
        <AdminAccessListPage />
      </MemoryRouter>
    </Provider>
  );

  return store;
};

const openNewPopup = async () => {
  fireEvent.click(screen.getByRole("button", { name: "admin_access.add" }));
  await waitFor(() =>
    expect(screen.getByTestId("admin-access-form")).toBeInTheDocument()
  );
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
    it("renders the table and no popup on initial load", () => {
      renderPage();
      expect(screen.getByTestId("mui-table")).toBeInTheDocument();
      expect(screen.queryByTestId("admin-access-form")).not.toBeInTheDocument();
    });

    it("opens popup and resets form when Add is clicked", async () => {
      renderPage();
      await openNewPopup();
      expect(mockResetAdminAccessForm).toHaveBeenCalled();
    });

    it("fetches the item and opens popup when edit row is clicked", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "edit" }));
      await waitFor(() =>
        expect(screen.getByTestId("admin-access-form")).toBeInTheDocument()
      );
      expect(mockGetAdminAccess).toHaveBeenCalledWith(1);
    });

    it("requests data for the selected page", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "page-2" }));
      await waitFor(() => {
        expect(mockGetAdminAccesses).toHaveBeenCalledWith("", 2, 10, "id", 1);
      });
    });

    it("requests data with selected rows per page", async () => {
      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "per-page-25" }));
      await waitFor(() => {
        expect(mockGetAdminAccesses).toHaveBeenCalledWith("", 1, 25, "id", 1);
      });
    });

    it("requests data with new sort column and direction", async () => {
      renderPage();
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
      renderPage();
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

  describe("popup open/close", () => {
    it("closes popup and resets form when close button is clicked", async () => {
      renderPage();
      await openNewPopup();

      fireEvent.click(screen.getByTestId("CloseIcon").closest("button"));

      await waitFor(() =>
        expect(
          screen.queryByTestId("admin-access-form")
        ).not.toBeInTheDocument()
      );
      expect(mockResetAdminAccessForm).toHaveBeenCalled();
    });

    it("does not open popup when getAdminAccess rejects", async () => {
      mockGetAdminAccess.mockReturnValue(() =>
        Promise.reject(new Error("not found"))
      );

      renderPage();
      fireEvent.click(screen.getByRole("button", { name: "edit" }));

      await act(async () => {
        await flushPromises();
      });

      expect(screen.queryByTestId("admin-access-form")).not.toBeInTheDocument();
    });
  });

  describe("save guard", () => {
    it("disables the X button and submit while save is in flight", async () => {
      mockSaveAdminAccess.mockReturnValue(() => new Promise(() => {}));

      renderPage();
      await openNewPopup();

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

      renderPage();
      await openNewPopup();

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

  describe("list management", () => {
    it("reloads the list after a successful save", async () => {
      renderPage();
      await openNewPopup();

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
      renderPage();

      const callsBefore = mockGetAdminAccesses.mock.calls.length;

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "delete" }));
        await flushPromises();
      });

      expect(mockGetAdminAccesses.mock.calls.length).toBeGreaterThan(
        callsBefore
      );
    });

    it("reloads from page 1 after a successful delete", async () => {
      renderPage({ ...baseListState, currentPage: 3 });

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
