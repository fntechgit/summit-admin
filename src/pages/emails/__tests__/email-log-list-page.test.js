import React from "react";
import { screen, act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import { getRequest } from "openstack-uicore-foundation/lib/utils/actions";
import EmailLogListPage from "../email-log-list-page";
import emailLogListReducer from "../../../reducers/emails/email-log-list-reducer";
import * as methods from "../../../utils/methods";

jest.mock("openstack-uicore-foundation/lib/utils/actions", () => ({
  __esModule: true,
  ...jest.requireActual("openstack-uicore-foundation/lib/utils/actions"),
  getRequest: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/grid-filter", () => ({
  __esModule: true,
  ...jest.requireActual(
    "openstack-uicore-foundation/lib/components/mui/grid-filter"
  ),
  GridFilter: () => null,
  useGridFilter: () => ({ parsedFilter: [], filterValues: [] })
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/search-input",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, columns, onPageChange, onPerPageChange }) => (
    <div>
      <button type="button" onClick={() => onPerPageChange(50)}>
        set-per-page-50
      </button>
      <button type="button" onClick={() => onPageChange(2)}>
        go-to-page-2
      </button>
      {data.map((row) => (
        <div key={row.id}>
          {columns.map((col) => (
            <span key={col.columnKey} data-testid={`cell-${col.columnKey}`}>
              {col.render ? col.render(row) : row[col.columnKey]}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const buildStore = (emailLogListOverrides) =>
  createStore(
    combineReducers({
      currentSummitState: (state = { currentSummit: { id: 1 } }) => state,
      emailLogListState: emailLogListReducer
    }),
    {
      emailLogListState: {
        ...emailLogListReducer(undefined, {}),
        ...emailLogListOverrides
      }
    },
    applyMiddleware(thunk)
  );

describe("SentEmailListPage", () => {
  beforeEach(() => {
    jest.spyOn(methods, "getAccessTokenSafely").mockResolvedValue("TOKEN");
    getRequest.mockImplementation(
      () => () => () =>
        Promise.resolve({
          response: { total: 0, last_page: 1, current_page: 1, data: [] }
        })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Show Columns", () => {
    const mockPayloadObject = {
      summit_reassign_ticket_till_date: "Monday 1 January 2027 12:00 AM PST",
      order_owner_full_name: "Jane Doe",
      order_owner_company: "Acme Corp",
      order_owner_email: "jane.doe@acme.test",
      owner_first_name: "John",
      owner_last_name: "Smith",
      owner_company: "Acme Corp",
      owner_email: "john.smith@acme.test",
      owner_full_name: "John Smith",
      support_email: "support@example.test",
      summit_virtual_site_oauth2_client_id: "abcXYZ123.client",
      summit_marketing_site_oauth2_client_id: "abcXYZ123.client",
      summit_marketing_site_oauth2_scopes:
        "openid profile email offline_access",
      summit_id: 99,
      summit_name: "Test Summit 2027",
      summit_logo: "https://example.test/logo.svg",
      summit_virtual_site_url:
        "https://idp.example.test/auth/password/set/token?client_id=abcXYZ123.client",
      summit_marketing_site_url:
        "https://idp.example.test/auth/password/set/token?client_id=abcXYZ123.client",
      raw_summit_virtual_site_url: "https://virtual.example.test/a",
      raw_summit_marketing_site_url: "https://marketing.example.test",
      summit_date: "January 1, 2027",
      summit_dates_label: "January 1-3, 2027",
      summit_schedule_url: "",
      summit_site_url: "https://marketing.example.test/",
      registration_link: null,
      virtual_event_site_link: "https://virtual.example.test/a",
      main_venue_address: "123 Main St, Testville, TS",
      summit_marketing_site_url_magic_link: "",
      edit_ticket_link:
        "https://marketing.example.test/#login=1&email=john.smith@acme.test&BackUrl=/a/my-tickets",
      EMAIL_TEMPLATE_GENERIC_BANNER: "https://example.test/banner.png",
      EMAIL_TEMPLATE_DRAFT_INSTRUCTIONS_URL:
        "<p><a href=\"https://docs.example.test/draft\">https://docs.example.test/draft</a></p>",
      EMAIL_TEMPLATE_DRAFT_DUE_DATE: "March 1 - 5",
      EMAIL_TEMPLATE_FINAL_DUE_DATE: "April 1",
      EMAIL_TEMPLATE_REVIEW_PERIOD: "March 1 - 5, 2027",
      EMAIL_TEMPLATE_SPEAKER_PORTAL_URL: "https://speaker.example.test/plans",
      EMAIL_TEMPLATE_SPEAKER_ACCEPTED_INTRO:
        "<p>Thank you for your submission.</p>",
      EMAIL_TEMPLATE_SPEAKER_ACCEPTED_NEXT_STEPS: "<p>Next steps go here.</p>",
      EMAIL_TEMPLATE_GREETING: "Hello",
      EMAIL_TEMPLATE_GENERIC_SPEAKER_BANNER:
        "https://example.test/speaker-banner.png",
      EMAIL_TEMPLATE_TICKET_TOP_GRAPHIC: "https://example.test/ticket-top.jpg",
      EMAIL_TEMPLATE_TICKET_BOTTOM_GRAPHIC:
        "https://example.test/ticket-bottom.jpg",
      EMAIL_TEMPLATE_PRIMARY_COLOR: "#111111",
      EMAIL_TEMPLATE_SECONDARY_COLOR: "#eeeeee"
    };

    // The reducer hands the page an already-serialized string, not the object.
    const serializedPayload = JSON.stringify(mockPayloadObject);

    it("renders the full serialized payload when Payload is selected in Show Columns", async () => {
      const store = buildStore({
        emails: [
          {
            id: 1,
            template: "welcome-email",
            subject: "Welcome",
            from_email: "from@test.com",
            to_email: "to@test.com",
            sent_date: "2020-01-01",
            last_error: "N/A",
            payload: serializedPayload
          }
        ],
        totalEmails: 1
      });

      render(
        <Provider store={store}>
          <EmailLogListPage />
        </Provider>
      );

      await act(async () => {
        await userEvent.click(
          screen.getByRole("combobox", { name: "email_logs.select_fields" })
        );
      });
      await act(async () => {
        await userEvent.click(
          screen.getByRole("option", { name: "email_logs.payload" })
        );
      });

      expect(screen.getByTestId("cell-payload")).toHaveTextContent(
        serializedPayload
      );
    });
  });
});
