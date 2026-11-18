import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";
import EditTicketPage from "../edit-ticket-page";
import { reSendTicketEmail } from "../../../actions/ticket-actions";
import showConfirmDialog from "../../../components/mui/showConfirmDialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("react-breadcrumbs", () => ({ Breadcrumb: () => null }));
jest.mock("../../../components/forms/ticket-form", () => () => null);
jest.mock("../../../components/forms/badge-form", () => () => null);
jest.mock("../../../components/notes/notes-panel", () => () => null);
jest.mock("../../../components/audit-logs", () => () => null);
jest.mock("../../../components/mui/showConfirmDialog", () => jest.fn());

const mockErrorMessage = jest.fn();
jest.mock(
  "openstack-uicore-foundation/lib/components/mui/snackbar-notification",
  () => ({ useSnackbarMessage: () => ({ errorMessage: mockErrorMessage }) })
);

// a declaration so the hoisted jest.mock factories can use it
function mockThunk() {
  return jest.fn(() => () => Promise.resolve());
}

jest.mock("../../../actions/ticket-actions", () => ({
  getTicket: mockThunk(),
  saveTicket: mockThunk(),
  reassignTicket: mockThunk(),
  addBadgeToTicket: mockThunk(),
  reSendTicketEmail: mockThunk(),
  activateTicket: mockThunk(),
  getTicketTypes: mockThunk(),
  refundTicket: mockThunk(),
  cancelRefundTicket: mockThunk()
}));

jest.mock("../../../actions/badge-actions", () => ({
  getBadgeFeatures: mockThunk(),
  getBadgeTypes: mockThunk(),
  deleteBadge: mockThunk(),
  addFeatureToBadge: mockThunk(),
  removeFeatureFromBadge: mockThunk(),
  changeBadgeType: mockThunk(),
  printBadge: mockThunk(),
  getBadgePrints: mockThunk(),
  exportBadgePrints: mockThunk(),
  clearBadgePrints: mockThunk()
}));

const ENTITY = {
  id: 10,
  order_id: 3,
  number: "TICKET-10",
  status: "Paid",
  is_active: true,
  badge: null,
  owner: { id: 7, status: "Incomplete" },
  currency_symbol: "$",
  applied_taxes: [],
  refund_requests_taxes: [],
  refund_requests: [
    { id: 1, status: "Requested" },
    { id: 2, status: "Approved" }
  ]
};

const renderPage = (entity = ENTITY) =>
  render(
    <Provider
      store={createStore(
        combineReducers({
          baseState: (state = { loading: 0 }) => state,
          currentSummitState: (
            state = { currentSummit: { id: 1, time_zone_id: "UTC" } }
          ) => state,
          currentPurchaseOrderState: (state = { entity: { id: 3 } }) => state,
          currentTicketState: (state = { entity, errors: {} }) => state,
          currentBadgePrintState: (state = {}) => state
        }),
        applyMiddleware(thunk)
      )}
    >
      <EditTicketPage
        match={{
          url: "/app/summits/1/purchase-orders/3/tickets/10",
          params: { ticket_id: "10" }
        }}
        history={{ push: jest.fn() }}
      />
    </Provider>
  );

const rejectButton = (row) =>
  within(row).queryByRole("button", { name: "edit_ticket.cancel_refund" });

describe("EditTicketPage", () => {
  beforeEach(() => jest.clearAllMocks());

  test("reject is only offered on refund requests in Requested status", async () => {
    renderPage();
    await userEvent.click(screen.getByText("edit_ticket.refund_requests"));

    const [requested, approved] = screen.getAllByRole("row").slice(1);
    expect(rejectButton(requested)).toBeInTheDocument();
    expect(rejectButton(approved)).not.toBeInTheDocument();
  });

  test("resend email confirms for an incomplete attendee and is refused without one", async () => {
    showConfirmDialog.mockResolvedValueOnce(true);
    const { unmount } = renderPage();

    await userEvent.click(
      screen.getByRole("button", { name: "edit_ticket.resend_email" })
    );
    await waitFor(() => expect(reSendTicketEmail).toHaveBeenCalledWith(3, 10));
    expect(showConfirmDialog).toHaveBeenCalledTimes(1);
    unmount();

    renderPage({ ...ENTITY, owner: null });
    await userEvent.click(
      screen.getByRole("button", { name: "edit_ticket.resend_email" })
    );
    expect(mockErrorMessage).toHaveBeenCalledWith("edit_ticket.no_attendee");
    expect(reSendTicketEmail).toHaveBeenCalledTimes(1);
  });
});
