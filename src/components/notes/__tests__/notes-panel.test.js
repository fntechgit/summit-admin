import React from "react";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import "@testing-library/jest-dom";
import NotesPanel from "../notes-panel";

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../actions/notes-actions", () => ({
  __esModule: true,
  getNotes: jest.fn(() => () => Promise.resolve()),
  exportNotes: jest.fn(),
  saveNote: jest.fn(),
  deleteNote: jest.fn(),
  clearNotesParams: jest.fn(() => ({ type: "CLEAR_NOTES_PARAMS" }))
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
});
