import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import { allFiltersReducer } from "openstack-uicore-foundation/lib/components/mui/grid-filter";
import AuditLogs from "../index";
import auditLogReducer from "../../../reducers/audit_log/audit-log-reducer";
import { getAuditLog } from "../../../actions/audit-log-actions";
import { renderWithRedux } from "../../../utils/test-utils";

jest.mock("i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../actions/audit-log-actions", () => ({
  getAuditLog: jest.fn(() => ({ type: "MOCK_GET_AUDIT_LOG" })),
  clearAuditLogParams: jest.fn(() => ({ type: "MOCK_CLEAR_AUDIT_LOG_PARAMS" }))
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryMembers: (term, callback) =>
    callback([
      {
        id: 42,
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com"
      }
    ])
}));

// Stubs the MUI Autocomplete used by the async "user_id" value field so the
// test can select an option without driving the real popper/listbox.
jest.mock("@mui/material/Autocomplete", () => ({
  __esModule: true,
  default: ({ onChange, options }) => (
    <button
      type="button"
      data-testid="select-user-option"
      disabled={!options?.length}
      onClick={() => onChange({}, options[0])}
    >
      select-user-option
    </button>
  )
}));

const currentSummitStateReducer = (state = { currentSummit: {} }) => state;

const buildStore = () =>
  createStore(
    combineReducers({
      allGridFiltersState: allFiltersReducer,
      auditLogState: auditLogReducer,
      currentSummitState: currentSummitStateReducer
    }),
    applyMiddleware(thunk)
  );

const renderAuditLogs = (props = {}) => {
  const store = buildStore();
  render(
    <Provider store={store}>
      <AuditLogs filterId="test-entity" entityFilter={[]} {...props} />
    </Provider>
  );
  return store;
};

// Expect a console.error PropTypes warning from GridFilter's `Re` component —
// a pre-existing gap in openstack-uicore-foundation, unrelated to this test.
describe("AuditLogs grid filter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("applying a user_id filter fetches logs with a non-empty parsed filter", async () => {
    renderAuditLogs();

    await userEvent.click(
      screen.getByRole("button", { name: "grid_filter.open_filters" })
    );

    const dialog = await screen.findByRole("dialog");
    const columnSelect = within(dialog).getAllByRole("combobox")[0];
    await userEvent.click(columnSelect);
    await userEvent.click(
      await screen.findByRole("option", {
        name: "audit_log.placeholders.user_id"
      })
    );

    const selectUserOption = await screen.findByTestId("select-user-option");
    await waitFor(() => expect(selectUserOption).toBeEnabled());
    await userEvent.click(selectUserOption);

    await userEvent.click(
      within(dialog).getByRole("button", { name: "grid_filter.apply_filters" })
    );

    await waitFor(() => {
      const appliedCall = getAuditLog.mock.calls.find(
        (call) => call[6]?.length > 0
      );
      expect(appliedCall).toBeDefined();
      expect(appliedCall[6]).toEqual(["user_id==42"]);
    });
  });
});

const baseAuditLogState = {
  term: "",
  logEntries: [],
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  order: "created",
  orderDir: 1,
  totalLogEntries: 0
};

const renderWithAuditLogState = (props = {}, auditLogState = {}) =>
  renderWithRedux(
    <AuditLogs filterId="test-entity" entityFilter={[]} {...props} />,
    {
      initialState: {
        currentSummitState: { currentSummit: {} },
        auditLogState: { ...baseAuditLogState, ...auditLogState }
      }
    }
  );

describe("AuditLogs columns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Guards the regression where the column read the raw audit.action verb
  // (create/update/delete/...) instead of the parsed audit.description
  // sentence, and where the ticket page's column subset didn't match the
  // reducer's field name — both must stay in sync as "action_description".
  // The fixture carries both action and action_description, as real reducer
  // output always does, so reading the wrong one renders a visibly wrong
  // value ("update") rather than an absence.
  test("renders the caller's column subset, wired to the reducer's `action_description` key", () => {
    renderWithAuditLogState(
      { columns: ["created", "action_description", "user"] },
      {
        logEntries: [
          {
            id: 1,
            created: "August 17th 2026, 12:00 pm",
            action: "update",
            action_description: "Presentation 'Keynote' (6714) updated: title",
            event_id: 55,
            user: "Jane Doe (7)"
          }
        ],
        totalLogEntries: 1
      }
    );

    // "created" is sortable and currently the active sort column, so MUI
    // appends a visually-hidden "sorted ascending" indicator to its header
    // text — assert prefixes rather than exact text for that one.
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toHaveLength(3);
    expect(headers[0]).toMatch(/^audit_log\.date/);
    expect(headers[1]).toBe("audit_log.action");
    expect(headers[2]).toBe("audit_log.user");
    expect(
      screen.getByText("Presentation 'Keynote' (6714) updated: title")
    ).toBeInTheDocument();
  });
});

describe("AuditLogs sorting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("clicking a sortable column header re-fetches with that column", () => {
    renderWithAuditLogState(
      {},
      {
        logEntries: [
          {
            id: 1,
            created: "August 17th 2026, 12:00 pm",
            action: "update",
            action_description: "Presentation 'Keynote' (6714) updated: title",
            event_id: 55,
            user: "Jane Doe (7)"
          }
        ],
        totalLogEntries: 1
      }
    );
    getAuditLog.mockClear();

    fireEvent.click(screen.getByText("audit_log.date"));

    expect(getAuditLog).toHaveBeenLastCalledWith(
      [],
      "",
      1,
      10,
      "created",
      expect.any(Number),
      []
    );
  });
});

describe("AuditLogs pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("changing rows-per-page re-fetches with the new perPage", async () => {
    renderWithAuditLogState(
      {},
      {
        logEntries: [
          {
            id: 1,
            created: "August 17th 2026, 12:00 pm",
            action: "update",
            action_description: "Presentation 'Keynote' (6714) updated: title",
            event_id: 55,
            user: "Jane Doe (7)"
          }
        ],
        totalLogEntries: 30
      }
    );
    getAuditLog.mockClear();

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "20" }));

    await waitFor(() => {
      expect(getAuditLog).toHaveBeenLastCalledWith(
        [],
        "",
        1,
        20,
        "created",
        1,
        []
      );
    });
  });
});

describe("AuditLogs empty state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // At zero rows MuiTable doesn't mount at all, so pagination and the
  // per-page selector disappear along with it — documenting current
  // behaviour rather than asserting it's desirable.
  test("shows the empty message and renders no table when there are no log entries", () => {
    renderWithAuditLogState({}, { logEntries: [], totalLogEntries: 0 });

    expect(screen.getByText("audit_log.no_log_entries")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
