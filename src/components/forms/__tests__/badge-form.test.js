import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import moment from "moment-timezone";
import BadgeForm from "../badge-form";
import showConfirmDialog from "../../mui/showConfirmDialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../mui/showConfirmDialog", () => jest.fn());

const DATE_FORMAT = "YYYY-MM-DD HH:mm";

/* eslint-disable global-require */
jest.mock("@mui/x-date-pickers/DateTimePicker", () => {
  const ReactMock = require("react");
  const momentMock = require("moment-timezone");
  return {
    DateTimePicker: ({ label, onChange }) =>
      ReactMock.createElement("input", {
        "aria-label": label,
        onChange: (e) =>
          onChange(
            e.target.value
              ? momentMock(e.target.value, "YYYY-MM-DD HH:mm", true)
              : null
          )
      })
  };
});
/* eslint-enable global-require */

const currentSummit = {
  badge_types: [
    {
      id: 1,
      name: "General",
      access_levels: [{ id: 10, name: "IN_PERSON" }],
      allowed_view_types: [100]
    },
    { id: 2, name: "VIP", access_levels: [10], allowed_view_types: [100] }
  ],
  badge_access_level_types: [{ id: 10, name: "IN_PERSON" }],
  badge_view_types: [{ id: 100, name: "Card" }],
  badge_features: [{ id: 5, name: "Speaker" }]
};

const entity = {
  id: 9,
  ticket_id: 3,
  type_id: 1,
  features: [],
  print_excerpt: { Card: 2 }
};

const badgePrints = {
  badgePrints: [
    {
      id: 1,
      view_type_name: "Card",
      requestor_full_name: "Jane Doe",
      requestor_email: "jane@example.com",
      print_date: "January 1st 2026, 10:00:00 am"
    }
  ],
  term: "jane",
  order: "print_date",
  orderDir: -1,
  currentPage: 1,
  perPage: 10,
  totalBadgePrints: 25
};

const callbacks = {
  onTypeChange: jest.fn(() => Promise.resolve()),
  onSelectPrintType: jest.fn(),
  onPrintBadge: jest.fn(),
  onShowBadgePrints: jest.fn(),
  onBadgePrintQuery: jest.fn(),
  onBadgePrintExport: jest.fn(),
  clearBadgePrints: jest.fn(() => Promise.resolve()),
  onFeatureLink: jest.fn(() => Promise.resolve()),
  onFeatureUnLink: jest.fn(() => Promise.resolve())
};

const formElement = (props = {}) => (
  <BadgeForm
    entity={entity}
    currentSummit={currentSummit}
    badgePrints={badgePrints}
    canPrint
    selectedPrintType={null}
    {...callbacks}
    {...props}
  />
);

const lastQueryArgs = () => callbacks.onBadgePrintQuery.mock.calls.at(-1);

const openDetails = () =>
  userEvent.click(screen.getByText("edit_ticket.print_excerpt_details"));

describe("BadgeForm", () => {
  beforeEach(() => jest.clearAllMocks());

  test("renders once badge data loads, and handles badge type, features and print state", async () => {
    const { container, rerender } = render(formElement({ currentSummit: {} }));
    expect(container).toBeEmptyDOMElement();

    rerender(formElement());
    const print = screen.getByRole("button", { name: "edit_ticket.print" });
    expect(print).toBeDisabled();

    rerender(formElement({ selectedPrintType: 100 }));
    expect(print).toBeEnabled();

    rerender(formElement({ selectedPrintType: 100, canPrint: false }));
    expect(print).toBeDisabled();

    await userEvent.click(screen.getByText("General"));
    await userEvent.click(screen.getByRole("option", { name: "VIP" }));
    expect(callbacks.onTypeChange).toHaveBeenCalledWith({
      ...entity,
      type_id: 2
    });

    const speaker = currentSummit.badge_features[0];
    await userEvent.click(screen.getByLabelText("edit_ticket.badge_features"));
    await userEvent.click(screen.getByRole("option", { name: "Speaker" }));
    expect(callbacks.onFeatureLink).toHaveBeenCalledWith(3, speaker);

    rerender(formElement({ entity: { ...entity, features: [speaker] } }));
    await userEvent.click(screen.getByTestId("CancelIcon"));
    expect(callbacks.onFeatureUnLink).toHaveBeenCalledWith(3, 5);
  });

  test("print history queries keep term, sort and filters, and reopening starts clean", async () => {
    render(formElement());
    await openDetails();
    expect(callbacks.onShowBadgePrints).toHaveBeenCalledTimes(1);

    const filters = { viewTypeFilter: [100], printDateFilter: [0, 0] };

    await userEvent.click(
      screen.getByText("edit_ticket.placeholders.view_type_filter")
    );
    await userEvent.click(screen.getByRole("option", { name: "Card" }));
    await userEvent.keyboard("{Escape}");
    expect(lastQueryArgs()).toEqual(["jane", 1, 10, "print_date", -1, filters]);

    await userEvent.click(
      screen.getAllByRole("button", { name: "mui_table.next_page" })[0]
    );
    expect(lastQueryArgs()).toEqual(["jane", 2, 10, "print_date", -1, filters]);

    await userEvent.click(
      screen.getByText("edit_ticket.print_table.requestor_email")
    );
    expect(lastQueryArgs()).toEqual([
      "jane",
      1,
      10,
      "requestor_email",
      1,
      filters
    ]);

    const search = screen.getByPlaceholderText(
      "edit_ticket.placeholders.search_badge_prints"
    );
    await userEvent.clear(search);
    await userEvent.type(search, "bob{Enter}");
    expect(lastQueryArgs()).toEqual(["bob", 1, 10, "print_date", -1, filters]);

    await userEvent.click(screen.getByText("edit_ticket.print_excerpt_less"));
    await openDetails();
    expect(callbacks.onShowBadgePrints).toHaveBeenCalledTimes(2);
    await userEvent.click(
      screen.getAllByRole("button", { name: "mui_table.next_page" })[0]
    );
    expect(lastQueryArgs()[5]).toEqual({
      viewTypeFilter: [],
      printDateFilter: [0, 0]
    });
  });

  test("apply filters rejects a half-typed date or from after to, and clear needs confirmation", async () => {
    render(formElement());
    await openDetails();
    const from = screen.getByLabelText(
      "edit_ticket.placeholders.print_date_from"
    );
    const to = screen.getByLabelText("edit_ticket.placeholders.print_date_to");
    const apply = screen.getByRole("button", {
      name: "edit_ticket.apply_filters"
    });

    await userEvent.type(from, "2026-01");
    await userEvent.click(apply);
    expect(
      screen.getByText("edit_ticket.print_table.badge_print_date_warning")
    ).toBeInTheDocument();

    await userEvent.clear(from);
    await userEvent.type(from, "2026-01-02 10:00");
    await userEvent.type(to, "2026-01-01 10:00");
    await userEvent.click(apply);
    expect(
      screen.getByText("edit_ticket.print_table.badge_print_date_warning")
    ).toBeInTheDocument();
    expect(callbacks.onBadgePrintQuery).not.toHaveBeenCalled();

    await userEvent.clear(to);
    await userEvent.type(to, "2026-01-03 10:00");
    await userEvent.click(apply);
    expect(
      screen.queryByText("edit_ticket.print_table.badge_print_date_warning")
    ).not.toBeInTheDocument();
    expect(lastQueryArgs()[5]).toEqual({
      viewTypeFilter: [],
      printDateFilter: [
        moment("2026-01-02 10:00", DATE_FORMAT).unix(),
        moment("2026-01-03 10:00", DATE_FORMAT).unix()
      ]
    });

    showConfirmDialog.mockResolvedValueOnce(false);
    await userEvent.click(
      screen.getByRole("button", { name: "general.clear" })
    );
    expect(callbacks.clearBadgePrints).not.toHaveBeenCalled();

    showConfirmDialog.mockResolvedValueOnce(true);
    await userEvent.click(
      screen.getByRole("button", { name: "general.clear" })
    );
    await waitFor(() =>
      expect(callbacks.clearBadgePrints).toHaveBeenCalledWith(3)
    );
  });
});
