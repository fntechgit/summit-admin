import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { queryMembers } from "openstack-uicore-foundation/lib/utils/query-actions";
import TicketForm from "../ticket-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryMembers: jest.fn((input, callback) =>
    callback([
      {
        id: 5,
        email: "jane@test.com",
        first_name: "Jane",
        last_name: "Doe",
        company: "Initech"
      }
    ])
  ),
  queryTicketTypes: jest.fn((summitId, filters, callback) =>
    callback([
      { id: 1, name: "General" },
      { id: 2, name: "VIP" }
    ])
  )
}));

const ENTITY = {
  id: 10,
  order_id: 3,
  number: "TICKET-10",
  is_active: true,
  owner: { id: 7, email: "old@test.com", company: "Acme" },
  ticket_type: { id: 1, name: "General" },
  attendee: {},
  attendee_company: "Acme",
  refunded_amount: 0
};

const renderForm = () => {
  const props = {
    entity: ENTITY,
    order: { id: 3, number: "ORDER-3" },
    currentSummit: { id: 1 },
    history: { push: jest.fn() },
    onSaveTicket: jest.fn(() => Promise.resolve()),
    onReassing: jest.fn(() => Promise.resolve()),
    onUnAssign: jest.fn(() => Promise.resolve())
  };
  const utils = render(<TicketForm {...props} />);
  return { ...utils, props };
};

const saveButton = () => screen.queryByRole("button", { name: "general.save" });

describe("TicketForm", () => {
  beforeEach(() => jest.clearAllMocks());

  test("save appears after the ticket type changes, sends the owner email or the typed attendee, and hides once saved", async () => {
    const { props, rerender } = renderForm();
    expect(saveButton()).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("combobox", { name: "edit_ticket.type" })
    );
    await userEvent.click(await screen.findByRole("option", { name: "VIP" }));
    await userEvent.click(saveButton());

    await waitFor(() =>
      expect(props.onSaveTicket).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          id: 10,
          ticket_type: { id: 2 },
          attendee_email: "old@test.com"
        })
      )
    );

    const savedEntity = { ...ENTITY, ticket_type: { id: 2, name: "VIP" } };
    rerender(<TicketForm {...props} entity={savedEntity} />);
    await waitFor(() => expect(saveButton()).not.toBeInTheDocument());

    rerender(
      <TicketForm {...props} entity={{ ...savedEntity, owner: null }} />
    );
    await userEvent.type(
      document.getElementById("attendee_email"),
      "new@test.com"
    );
    await userEvent.type(document.getElementById("attendee_first_name"), "New");
    await userEvent.type(document.getElementById("attendee_last_name"), "Guy");
    await userEvent.clear(document.getElementById("attendee_company"));
    await userEvent.type(document.getElementById("attendee_company"), "Globex");
    await userEvent.click(
      screen.getByRole("combobox", { name: "edit_ticket.type" })
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "General" })
    );
    await userEvent.click(saveButton());

    await waitFor(() =>
      expect(props.onSaveTicket).toHaveBeenLastCalledWith(
        3,
        expect.objectContaining({
          ticket_type: { id: 1 },
          attendee: {
            email: "new@test.com",
            first_name: "New",
            last_name: "Guy"
          },
          attendee_company: "Globex"
        })
      )
    );
  });

  test("reassign ignores stale member results and sends the picked member's data", async () => {
    const pending = [];
    queryMembers.mockImplementation((input, callback) =>
      pending.push(callback)
    );
    const { props } = renderForm();

    await userEvent.click(
      screen.getByRole("button", { name: "edit_ticket.reassign" })
    );
    await userEvent.type(document.getElementById("attendee_email"), "jane");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    act(() =>
      pending.at(-1)([
        {
          id: 5,
          email: "jane@test.com",
          first_name: "Jane",
          last_name: "Doe",
          company: "Initech"
        }
      ])
    );
    act(() =>
      pending[0]([
        { id: 9, email: "j@test.com", first_name: "Old", last_name: "Result" }
      ])
    );
    expect(
      screen.queryByRole("option", { name: "Old Result (j@test.com)" })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole("option", {
        name: "Jane Doe (jane@test.com)"
      })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "edit_ticket.assign" })
    );

    expect(props.onReassing).toHaveBeenCalledWith(
      10,
      7,
      "Jane",
      "Doe",
      "jane@test.com",
      "Initech"
    );
    expect(
      await screen.findByRole("button", { name: "edit_ticket.reassign" })
    ).toBeInTheDocument();
  });
});
