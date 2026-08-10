import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import Swal from "sweetalert2";
import "@testing-library/jest-dom";
import NotesPanel from "../notes-panel";

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: {
    translate: (key) =>
      key === "notes_panel.remove_warning"
        ? "Are you sure you want to delete note"
        : key
  }
}));

jest.mock("../../../actions/notes-actions", () => ({
  __esModule: true,
  getNotes: jest.fn(() => () => Promise.resolve()),
  exportNotes: jest.fn(),
  saveNote: jest.fn(() => ({ type: "NOTE_SAVE_NOOP" })),
  deleteNote: jest.fn(() => ({ type: "NOTE_DELETE_NOOP" })),
  clearNotesParams: jest.fn(() => ({ type: "CLEAR_NOTES_PARAMS" }))
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn(() => Promise.resolve()) }
}));

jest.mock("openstack-uicore-foundation/lib/components/table", () => ({
  __esModule: true,
  default: ({ options, data }) => (
    <button
      type="button"
      onClick={() => options.actions.delete.onClick(data[0].id)}
    >
      delete-note
    </button>
  )
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const stateWithNotes = {
  notesState: {
    notes: [
      {
        id: 1,
        created: "2026-01-01",
        author_fullname: "Jane Doe",
        author_email: "jane@example.com",
        content: "A note"
      }
    ],
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    order: "created",
    orderDir: -1
  }
};

describe("NotesPanel", () => {
  it("does not throw when a columns filter is provided (regression: columns.include is not a function)", async () => {
    const store = mockStore(stateWithNotes);

    expect(() =>
      render(
        <Provider store={store}>
          <NotesPanel
            attendeeId={1}
            open
            onToggle={jest.fn()}
            onOpen={jest.fn()}
            columns={["id", "content"]}
          />
        </Provider>
      )
    ).not.toThrow();

    await waitFor(() => expect(true).toBe(true));
  });

  it("does not render a double space between 'note' and the id in the delete-confirmation text", async () => {
    const store = mockStore(stateWithNotes);

    const { getByText } = render(
      <Provider store={store}>
        <NotesPanel
          attendeeId={1}
          open
          onToggle={jest.fn()}
          onOpen={jest.fn()}
        />
      </Provider>
    );

    fireEvent.click(getByText("delete-note"));

    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());
    const { text } = Swal.fire.mock.calls[0][0];

    expect(text).not.toMatch(/ {2,}/);
    expect(text).toBe("Are you sure you want to delete note 1");
  });
});
