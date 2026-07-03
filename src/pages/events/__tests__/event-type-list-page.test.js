import React from "react";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import flushPromises from "flush-promises";
import { renderWithRedux } from "../../../utils/test-utils";
import EventTypeListPage from "../event-type-list-page";
import {
  getEventTypes,
  getEventType,
  deleteEventType,
  resetEventTypeForm,
  saveEventType
} from "../../../actions/event-type-actions";

jest.mock("../../../actions/event-type-actions", () => ({
  getEventTypes: jest.fn(),
  getEventType: jest.fn(),
  deleteEventType: jest.fn(),
  seedEventTypes: jest.fn(),
  resetEventTypeForm: jest.fn(),
  saveEventType: jest.fn()
}));

jest.mock("../../../actions/media-upload-actions", () => ({
  linkToPresentationType: jest.fn(),
  unlinkFromPresentationType: jest.fn(),
  queryMediaUploads: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete, onSort, onPageChange, onPerPageChange }) => (
    <div data-testid="mui-table">
      <button type="button" onClick={() => onEdit({ id: 7 })}>
        edit-row
      </button>
      <button type="button" onClick={() => onDelete(7)}>
        delete-row
      </button>
      <button type="button" onClick={() => onSort("name", 0)}>
        sort-name
      </button>
      <button type="button" onClick={() => onPageChange(2)}>
        page-2
      </button>
      <button type="button" onClick={() => onPerPageChange(20)}>
        per-page-20
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <button type="button" onClick={() => onSearch("foo")}>
        search-foo
      </button>
    )
  })
);

jest.mock("../components/event-type-dialog", () => ({
  __esModule: true,
  default: ({ onSave, onClose }) => (
    <div data-testid="event-type-dialog">
      <button type="button" onClick={() => onSave({ id: 7 })}>
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
    currentSummit: { id: 42 }
  },
  currentEventTypeListState: {
    eventTypes: [{ id: 7, name: "Talk", class_name: "PresentationType" }],
    totalEventTypes: 1,
    perPage: 10,
    currentPage: 3,
    term: "",
    order: "id",
    orderDir: 1
  },
  currentEventTypeState: {
    entity: { id: 0, name: "", class_name: "", allowed_media_upload_types: [] },
    errors: {}
  }
};

describe("EventTypeListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEventTypes.mockReturnValue(() => Promise.resolve());
    getEventType.mockReturnValue(() => Promise.resolve());
    deleteEventType.mockReturnValue(() => Promise.resolve());
    saveEventType.mockReturnValue(() => Promise.resolve());
    resetEventTypeForm.mockReturnValue({ type: "RESET_EVENT_TYPE_FORM" });
  });

  it("threads search, pagination and sort params to getEventTypes", async () => {
    renderWithRedux(<EventTypeListPage />, { initialState });

    await userEvent.click(screen.getByRole("button", { name: "search-foo" }));
    // search resets to the first page and keeps current order
    expect(getEventTypes).toHaveBeenLastCalledWith("foo", 1, 10, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "page-2" }));
    expect(getEventTypes).toHaveBeenLastCalledWith("", 2, 10, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "per-page-20" }));
    // per-page change resets to the first page
    expect(getEventTypes).toHaveBeenLastCalledWith("", 1, 20, "id", 1);

    await userEvent.click(screen.getByRole("button", { name: "sort-name" }));
    // sorting resets to the first page so results reflect the new ordering
    expect(getEventTypes).toHaveBeenLastCalledWith("", 1, 10, "name", 0);
  });

  it("fetches the entity and opens the dialog when clicking edit", async () => {
    renderWithRedux(<EventTypeListPage />, { initialState });

    expect(screen.queryByTestId("event-type-dialog")).not.toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    expect(getEventType).toHaveBeenCalledWith(7);
    expect(screen.getByTestId("event-type-dialog")).toBeInTheDocument();
  });

  it("reloads the list after a successful save", async () => {
    renderWithRedux(<EventTypeListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "edit-row" }));
      await flushPromises();
    });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "popup-save" }));
      await flushPromises();
    });

    expect(saveEventType).toHaveBeenCalledWith({ id: 7 });
    // Call 1: useEffect on mount; call 2: handleSave refresh
    expect(getEventTypes).toHaveBeenCalledTimes(2);
    expect(getEventTypes).toHaveBeenLastCalledWith("", 1, 10, "id", 1);
  });

  it("reloads the list after a successful delete", async () => {
    renderWithRedux(<EventTypeListPage />, { initialState });

    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: "delete-row" }));
      await flushPromises();
    });

    expect(deleteEventType).toHaveBeenCalledWith(7);
    // Call 1: useEffect on mount; call 2: handleDelete refresh
    expect(getEventTypes).toHaveBeenCalledTimes(2);
  });

  it("resets the form when opening the add dialog and unmounts it on close", async () => {
    renderWithRedux(<EventTypeListPage />, { initialState });

    await userEvent.click(
      screen.getByRole("button", { name: "event_type_list.add_event_type" })
    );

    expect(resetEventTypeForm).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("event-type-dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "popup-close" }));

    expect(screen.queryByTestId("event-type-dialog")).not.toBeInTheDocument();
  });
});
