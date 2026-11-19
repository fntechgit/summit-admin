import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import "@testing-library/jest-dom";
import { GlobalConfirmDialog } from "openstack-uicore-foundation/lib/components/mui/show-confirm-dialog";
import NotesPanel from "../notes-panel";
import { deleteNote, getNotes, saveNote } from "../../../actions/notes-actions";

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));
jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../actions/notes-actions", () => ({
  __esModule: true,
  getNotes: jest.fn(() => () => Promise.resolve()),
  exportNotes: jest.fn(() => () => Promise.resolve()),
  saveNote: jest.fn(() => () => Promise.resolve()),
  deleteNote: jest.fn(() => () => Promise.resolve()),
  clearNotesParams: jest.fn(() => ({ type: "CLEAR_NOTES_PARAMS" }))
}));

const note = (id) => ({
  id,
  created: "January 1st 2026, 10:00 am",
  author_fullname: "Jane Doe",
  author_email: "jane@example.com",
  content: `note ${id}`
});

const renderPanel = (notesState = {}) =>
  render(
    <Provider
      store={configureStore([thunk])({
        currentSummitState: { currentSummit: { id: 1 } },
        notesState: {
          notes: [note(1)],
          currentPage: 1,
          perPage: 10,
          totalNotes: 1,
          order: "created",
          orderDir: -1,
          ...notesState
        }
      })}
    >
      <NotesPanel attendeeId={7} open onToggle={jest.fn()} onOpen={jest.fn()} />
      <GlobalConfirmDialog />
    </Provider>
  );

const lastGetNotesArgs = () => getNotes.mock.calls.at(-1);

const startDelete = async () => {
  await userEvent.click(
    screen.getAllByRole("button", { name: "general.more_actions" })[0]
  );
  await userEvent.click(
    await screen.findByRole("menuitem", { name: "general.delete" })
  );
  return screen.findByRole("dialog");
};

describe("NotesPanel", () => {
  beforeEach(() => jest.clearAllMocks());

  test("deletes only after confirming, then reloads page 1", async () => {
    renderPanel({
      notes: [note(21), note(22)],
      currentPage: 3,
      totalNotes: 22
    });
    await waitFor(() => expect(getNotes).toHaveBeenCalledTimes(1));

    await startDelete();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(deleteNote).not.toHaveBeenCalled();

    await startDelete();
    await userEvent.click(
      screen.getByRole("button", { name: "general.yes_delete" })
    );
    await waitFor(() => expect(deleteNote).toHaveBeenCalledWith(7, 21));
    await waitFor(() => expect(getNotes).toHaveBeenCalledTimes(2));
    expect(lastGetNotesArgs()[3]).toBe(1);
  });

  test("a delete that resolves after a new search reloads with that search", async () => {
    let resolveDelete;
    deleteNote.mockImplementationOnce(
      () => () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        })
    );
    renderPanel();

    await startDelete();
    await userEvent.click(
      screen.getByRole("button", { name: "general.yes_delete" })
    );
    await waitFor(() => expect(deleteNote).toHaveBeenCalled());
    await userEvent.type(
      screen.getByPlaceholderText("notes_panel.placeholders.search"),
      "jane{Enter}"
    );
    resolveDelete();

    await waitFor(() => expect(getNotes).toHaveBeenCalledTimes(3));
    expect(lastGetNotesArgs()[2]).toBe("jane");
  });

  test("search goes to page 1 and sort and paging keep the term", async () => {
    renderPanel({ totalNotes: 25 });

    await userEvent.type(
      screen.getByPlaceholderText("notes_panel.placeholders.search"),
      "jane{Enter}"
    );
    expect(lastGetNotesArgs()).toEqual([
      7,
      undefined,
      "jane",
      1,
      10,
      "created",
      -1
    ]);

    await userEvent.click(screen.getByText("notes_panel.author_email"));
    expect(lastGetNotesArgs().slice(2, 4)).toEqual(["jane", 1]);
    expect(lastGetNotesArgs()[5]).toBe("author_email");

    await userEvent.click(
      screen.getAllByRole("button", { name: "mui_table.next_page" })[0]
    );
    expect(lastGetNotesArgs().slice(2, 4)).toEqual(["jane", 2]);
  });

  test("add is disabled for a blank note, then saves, clears the field and reloads page 1", async () => {
    renderPanel({ currentPage: 3, totalNotes: 21 });
    const add = screen.getByRole("button", { name: "general.add" });
    const field = document.getElementById("new_note");

    await userEvent.type(field, "   ");
    expect(add).toBeDisabled();

    await userEvent.clear(field);
    await userEvent.type(field, "called the attendee");
    await userEvent.click(add);

    await waitFor(() =>
      expect(saveNote).toHaveBeenCalledWith(7, undefined, "called the attendee")
    );
    await waitFor(() => expect(field).toHaveValue(""));
    expect(getNotes).toHaveBeenCalledTimes(2);
    expect(lastGetNotesArgs()[3]).toBe(1);
  });

  test("a save that resolves after the panel unmounts doesn't reload notes", async () => {
    let resolveSave;
    saveNote.mockImplementationOnce(
      () => () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );
    const { unmount } = renderPanel();

    await userEvent.type(document.getElementById("new_note"), "late note");
    await userEvent.click(screen.getByRole("button", { name: "general.add" }));
    await waitFor(() => expect(saveNote).toHaveBeenCalled());
    unmount();
    resolveSave();
    await Promise.resolve();

    expect(getNotes).toHaveBeenCalledTimes(1);
  });
});
