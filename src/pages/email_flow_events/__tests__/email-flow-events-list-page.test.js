import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { renderWithRedux, createMockSummit } from "../../../utils/test-utils";
import EmailFlowEventListPage from "../email-flow-events-list-page";
import { getEmailFlowEvents } from "../../../actions/email-flows-events-actions";

jest.mock("../../../actions/email-flows-events-actions", () => ({
  getEmailFlowEvents: jest.fn()
}));

jest.mock("../../../actions/summit-actions", () => ({
  getSummitById: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, onEdit, onSort, onPageChange }) => (
    <div>
      {data.map((row) => (
        <div key={row.id}>
          <span>{row.flow_name}</span>
          <button type="button" onClick={() => onEdit(row)}>
            {`edit-${row.id}`}
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onSort("flow_name", -1)}>
        sort-col
      </button>
      <button type="button" onClick={() => onPageChange(2)}>
        page-2
      </button>
    </div>
  )
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: ({ onSearch }) => (
      <button type="button" onClick={() => onSearch("newterm")}>
        search-trigger
      </button>
    )
  })
);

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockHistory = { push: jest.fn() };

const emailFlowEvents = [
  {
    id: 1,
    flow_name: "REGISTRATION",
    event_type_name: "Attendee Registered",
    email_template_identifier: "REG_TEMPLATE"
  },
  {
    id: 2,
    flow_name: "SPEAKERS",
    event_type_name: "Speaker Confirmed",
    email_template_identifier: "SPEAKER_TEMPLATE"
  }
];

const initialState = {
  currentSummitState: { currentSummit: createMockSummit() },
  emailFlowEventsListState: {
    emailFlowEvents,
    order: "email_template_identifier",
    orderDir: 1,
    totalEmailFlowEvents: 2,
    term: null,
    currentPage: 1,
    lastPage: 1,
    perPage: 10
  }
};

describe("EmailFlowEventListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEmailFlowEvents.mockReturnValue(() => Promise.resolve());
  });

  it("loads email flow events on mount using persisted params", () => {
    renderWithRedux(<EmailFlowEventListPage history={mockHistory} />, {
      initialState
    });

    expect(getEmailFlowEvents).toHaveBeenCalledWith(
      null,
      1,
      10,
      "email_template_identifier",
      1
    );
  });

  it("navigates to the edit route", async () => {
    renderWithRedux(<EmailFlowEventListPage history={mockHistory} />, {
      initialState
    });

    await userEvent.click(screen.getByRole("button", { name: "edit-2" }));

    expect(mockHistory.push).toHaveBeenCalledWith(
      `/app/summits/${createMockSummit().id}/email-flow-events/2`
    );
  });

  it("resets to the first page on search", async () => {
    renderWithRedux(<EmailFlowEventListPage history={mockHistory} />, {
      initialState
    });

    await userEvent.click(
      screen.getByRole("button", { name: "search-trigger" })
    );

    expect(getEmailFlowEvents).toHaveBeenCalledWith(
      "newterm",
      1,
      10,
      "email_template_identifier",
      1
    );
  });

  it("keeps the current page on sort", async () => {
    renderWithRedux(<EmailFlowEventListPage history={mockHistory} />, {
      initialState
    });

    await userEvent.click(screen.getByRole("button", { name: "sort-col" }));

    expect(getEmailFlowEvents).toHaveBeenCalledWith(
      null,
      1,
      10,
      "flow_name",
      -1
    );
  });

  it("changes page while keeping term/order", async () => {
    renderWithRedux(<EmailFlowEventListPage history={mockHistory} />, {
      initialState
    });

    await userEvent.click(screen.getByRole("button", { name: "page-2" }));

    expect(getEmailFlowEvents).toHaveBeenCalledWith(
      null,
      2,
      10,
      "email_template_identifier",
      1
    );
  });

  it("shows the empty state when there are no email flow events", () => {
    renderWithRedux(<EmailFlowEventListPage history={mockHistory} />, {
      initialState: {
        ...initialState,
        emailFlowEventsListState: {
          ...initialState.emailFlowEventsListState,
          emailFlowEvents: [],
          totalEmailFlowEvents: 0
        }
      }
    });

    expect(
      screen.getByText("email_flow_event_list.no_email_flow_events")
    ).toBeInTheDocument();
  });
});
