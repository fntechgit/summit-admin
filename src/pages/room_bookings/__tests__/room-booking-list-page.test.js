import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import RoomBookingListPage from "../room-booking-list-page";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock("openstack-uicore-foundation/lib/components", () => ({
  Table: ({ children, ...props }) => (
    <table data-testid="table" {...props}>
      {children}
    </table>
  ),
  FreeTextSearch: () => null
}));

jest.mock("react-bootstrap", () => ({
  Modal: ({ children }) => <div>{children}</div>,
  Pagination: ({ children }) => <nav data-testid="pagination">{children}</nav>
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(() => Promise.resolve({ value: false }))
}));

jest.mock("react-breadcrumbs", () => ({
  Breadcrumb: () => null
}));

jest.mock("../../../components/inputs/email-filter", () => () => null);

jest.mock("react-router-dom", () => ({
  withRouter: (component) => component
}));

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: (key) => key
}));

describe("RoomBookingListPage", () => {
  const initialState = {
    currentSummitState: {
      currentSummit: {
        id: 1,
        time_zone_id: "America/Denver"
      }
    },
    currentRoomBookingListState: {
      roomBookings: [
        {
          id: 101,
          created: "1/1/2024, 10:00:00 AM",
          room_name: "Speaker Support Rm 128",
          start_datetime: "2024-01-15 09:00:00",
          end_datetime: "2024-01-15 10:00:00",
          owner_name: "John Doe",
          owner_email: "john.doe@example.com",
          status: "Paid",
          amount_str: "$100",
          refunded_amount_str: "$0"
        }
      ],
      lastPage: 1,
      currentPage: 1,
      term: "",
      order: "start_datetime",
      orderDir: 1,
      totalRoomBookings: 1,
      perPage: 10,
      filters: {
        email_filter: { operator: null, value: "" }
      }
    }
  };

  test("table_is_wrapped_in_table_responsive_for_horizontal_scrolling", () => {
    const store = mockStore(initialState);
    const mockHistory = { push: jest.fn() };

    const { container } = render(
      <Provider store={store}>
        <RoomBookingListPage history={mockHistory} />
      </Provider>
    );

    const tableResponsiveWrapper = container.querySelector(".table-responsive");
    expect(tableResponsiveWrapper).toBeInTheDocument();

    const table = container.querySelector("table");
    expect(table).toBeInTheDocument();

    expect(tableResponsiveWrapper).toContainElement(table);
  });
});
