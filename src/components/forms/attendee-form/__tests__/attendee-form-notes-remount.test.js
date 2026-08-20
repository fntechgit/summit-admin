import React from "react";
import { render, waitFor, cleanup } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import "@testing-library/jest-dom";
import AttendeeForm from "../attendee-form";
import { getNotes } from "../../../../actions/notes-actions";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));
jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/member-input",
  () => ({ __esModule: true, default: () => null })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/attendee-input",
  () => ({ __esModule: true, default: () => null })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/tag-input",
  () => ({ __esModule: true, default: () => null })
);

jest.mock("../../../../actions/notes-actions", () => ({
  __esModule: true,
  getNotes: jest.fn(() => () => Promise.resolve()),
  exportNotes: jest.fn(),
  saveNote: jest.fn(),
  deleteNote: jest.fn(),
  clearNotesParams: jest.fn(() => ({ type: "CLEAR_NOTES_PARAMS" }))
}));

const SUMMIT = { id: 1, time_zone_id: "UTC" };

const defaultEntity = {
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  company: "Acme",
  shared_contact_info: false,
  summit_hall_checked_in: false,
  disclaimer_accepted: false,
  admin_notes: "",
  tags: [],
  tickets: [],
  orders: [],
  allowed_extra_questions: []
};

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const baseState = {
  notesState: {
    notes: [],
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    order: "created",
    orderDir: -1
  }
};

const renderForm = (entityOverride = {}, store) =>
  render(
    <Provider store={store}>
      <AttendeeForm
        entity={{ ...defaultEntity, ...entityOverride }}
        errors={{}}
        currentSummit={SUMMIT}
        onSubmit={jest.fn()}
      />
    </Provider>
  );

describe("AttendeeForm notes panel remount (regression)", () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it("refetches notes for the new attendee when the entity prop switches to a different attendee, instead of keeping the previous attendee's notes mounted", async () => {
    const store = mockStore(baseState);
    const { rerender } = renderForm({ id: 1 }, store);

    await waitFor(() => expect(getNotes).toHaveBeenCalledTimes(1));
    expect(getNotes).toHaveBeenLastCalledWith(
      1,
      undefined,
      undefined,
      1,
      10,
      "created",
      -1
    );

    rerender(
      <Provider store={store}>
        <AttendeeForm
          entity={{ ...defaultEntity, id: 2, first_name: "Alice" }}
          errors={{}}
          currentSummit={SUMMIT}
          onSubmit={jest.fn()}
        />
      </Provider>
    );

    await waitFor(() => expect(getNotes).toHaveBeenCalledTimes(2));
    expect(getNotes).toHaveBeenLastCalledWith(
      2,
      undefined,
      undefined,
      1,
      10,
      "created",
      -1
    );
  });
});
