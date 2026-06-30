import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { queryTicketTypes } from "openstack-uicore-foundation/lib/utils/query-actions";
import TaxTypeForm from "../tax-type-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/utils/query-actions", () => ({
  queryTicketTypes: jest.fn()
}));

jest.mock("openstack-uicore-foundation/lib/components/mui/table", () => ({
  __esModule: true,
  default: ({ data, onDelete }) => (
    <ul>
      {data.map((item) => (
        <li key={item.id}>
          <span>{item.name}</span>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
          >{`remove-ticket-${item.id}`}</button>
        </li>
      ))}
    </ul>
  )
}));

jest.mock("../../../hooks/useScrollToError", () => ({
  __esModule: true,
  default: jest.fn()
}));

const SUMMIT = { id: 1 };
const TICKET = { id: 10, name: "Standard Ticket" };

const defaultEntity = {
  id: 0,
  name: "",
  rate: "",
  tax_id: "",
  ticket_types: []
};

const renderForm = (
  entityOverride = {},
  { onSubmit, onTicketLink, onTicketUnLink } = {}
) =>
  render(
    <TaxTypeForm
      entity={{ ...defaultEntity, ...entityOverride }}
      currentSummit={SUMMIT}
      onTicketLink={
        onTicketLink || jest.fn().mockReturnValue(Promise.resolve())
      }
      onTicketUnLink={onTicketUnLink || jest.fn()}
      onSubmit={onSubmit || jest.fn()}
    />
  );

describe("TaxTypeForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryTicketTypes.mockImplementation((_, __, callback) =>
      callback([TICKET])
    );
  });

  it("blocks submit and shows error when rate exceeds 100", async () => {
    const onSubmit = jest.fn();
    renderForm({ name: "VAT" }, { onSubmit });

    await userEvent.type(screen.getByRole("spinbutton"), "101");
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(screen.getByText("validation.maximum")).toBeInTheDocument()
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("blocks submit and shows error when rate has more than 3 decimal places", async () => {
    const onSubmit = jest.fn();
    renderForm({ name: "VAT" }, { onSubmit });

    await userEvent.type(screen.getByRole("spinbutton"), "21.1234");
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(screen.getByText("validation.max_decimals")).toBeInTheDocument()
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits successfully when rate is at the upper boundary (100)", async () => {
    const onSubmit = jest.fn();
    renderForm({ name: "VAT" }, { onSubmit });

    await userEvent.type(screen.getByRole("spinbutton"), "100");
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.queryByText("validation.maximum")).not.toBeInTheDocument();
  });

  it("adds a ticket optimistically and calls onTicketLink", async () => {
    const onTicketLink = jest.fn().mockReturnValue(Promise.resolve());
    renderForm({ id: 1, name: "VAT", rate: 20 }, { onTicketLink });

    const combobox = screen.getByRole("combobox");
    await userEvent.click(combobox);
    await userEvent.type(combobox, "Stan");

    const option = await screen.findByRole("option", { name: TICKET.name });
    await userEvent.click(option);

    await userEvent.click(screen.getByRole("button", { name: "general.add" }));

    expect(screen.getByText(TICKET.name)).toBeInTheDocument();
    expect(onTicketLink).toHaveBeenCalledWith(1, TICKET);
  });

  it("rolls back ticket add when onTicketLink fails", async () => {
    const onTicketLink = jest
      .fn()
      .mockReturnValue(Promise.reject(new Error("link failed")));
    renderForm({ id: 1, name: "VAT", rate: 20 }, { onTicketLink });

    const combobox = screen.getByRole("combobox");
    await userEvent.click(combobox);
    await userEvent.type(combobox, "Stan");

    const option = await screen.findByRole("option", { name: TICKET.name });
    await userEvent.click(option);
    await userEvent.click(screen.getByRole("button", { name: "general.add" }));

    await waitFor(() =>
      expect(screen.queryByText(TICKET.name)).not.toBeInTheDocument()
    );
  });

  it("removes a linked ticket from the list and calls onTicketUnLink", async () => {
    const onTicketUnLink = jest.fn().mockReturnValue(Promise.resolve());
    const linked = { id: 5, name: "VIP Ticket" };
    renderForm(
      { id: 1, name: "VAT", rate: 20, ticket_types: [linked] },
      { onTicketUnLink }
    );

    await userEvent.click(
      screen.getByRole("button", { name: `remove-ticket-${linked.id}` })
    );

    await waitFor(() =>
      expect(screen.queryByText(linked.name)).not.toBeInTheDocument()
    );
    expect(onTicketUnLink).toHaveBeenCalledWith(1, linked.id);
  });

  it("rolls back ticket unlink when onTicketUnLink fails", async () => {
    const onTicketUnLink = jest
      .fn()
      .mockReturnValue(Promise.reject(new Error("unlink failed")));
    const linked = { id: 5, name: "VIP Ticket" };
    renderForm(
      { id: 1, name: "VAT", rate: 20, ticket_types: [linked] },
      { onTicketUnLink }
    );

    expect(screen.getByText(linked.name)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: `remove-ticket-${linked.id}` })
    );

    await waitFor(() =>
      expect(screen.getByText(linked.name)).toBeInTheDocument()
    );
  });
});
