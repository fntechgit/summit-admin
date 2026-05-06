import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ClientCard from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const mockClient = {
  company_name: "Acme Corp",
  contact_name: "John Doe",
  contact_email: "john@acme.com",
  contact_phone: "555-1234"
};

const mockAddress = {
  line1: "123 Main St",
  line2: "Suite 4",
  postal_code: "10001",
  city: "New York",
  state: "NY",
  country: "US"
};

describe("ClientCard", () => {
  describe("display", () => {
    it("renders client details", () => {
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={jest.fn()}
          onAddressSubmit={jest.fn()}
        />
      );
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it("renders address details", () => {
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={jest.fn()}
          onAddressSubmit={jest.fn()}
        />
      );
      expect(screen.getByText(/123 Main St/)).toBeInTheDocument();
      expect(screen.getByText(/New York/)).toBeInTheDocument();
    });

    it("shows N/A when all address fields are empty", () => {
      render(
        <ClientCard
          client={mockClient}
          address={{
            line1: "",
            line2: "",
            postal_code: "",
            city: "",
            state: "",
            country: ""
          }}
          onClientSubmit={jest.fn()}
          onAddressSubmit={jest.fn()}
        />
      );
      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  describe("edit client dialog", () => {
    it("opens edit client dialog when client edit button is clicked", async () => {
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={jest.fn()}
          onAddressSubmit={jest.fn()}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[0]);
      });

      expect(screen.getByText("client_card.edit_client")).toBeInTheDocument();
    });

    it("pre-fills edit client dialog with current client values", async () => {
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={jest.fn()}
          onAddressSubmit={jest.fn()}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[0]);
      });

      expect(screen.getByLabelText(/client_card\.company_name/i)).toHaveValue(
        "Acme Corp"
      );
      expect(screen.getByLabelText(/client_card\.contact_email/i)).toHaveValue(
        "john@acme.com"
      );
    });

    it("calls onClientSubmit with updated values on save", async () => {
      const onClientSubmit = jest.fn();
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={onClientSubmit}
          onAddressSubmit={jest.fn()}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[0]);
      });

      const companyField = screen.getByLabelText(/client_card\.company_name/i);
      await act(async () => {
        await userEvent.clear(companyField);
        await userEvent.type(companyField, "New Corp");
        await userEvent.click(
          screen.getByRole("button", { name: /client_card\.save/i })
        );
      });

      expect(onClientSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ company_name: "New Corp" })
      );
    });

    it("does not call onClientSubmit when required fields are empty", async () => {
      const onClientSubmit = jest.fn();
      render(
        <ClientCard
          client={{ ...mockClient, company_name: "" }}
          address={mockAddress}
          onClientSubmit={onClientSubmit}
          onAddressSubmit={jest.fn()}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[0]);
      });

      await act(async () => {
        await userEvent.click(
          screen.getByRole("button", { name: /client_card\.save/i })
        );
      });

      expect(onClientSubmit).not.toHaveBeenCalled();
    });
  });

  describe("edit address dialog", () => {
    it("opens edit address dialog when address edit button is clicked", async () => {
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={jest.fn()}
          onAddressSubmit={jest.fn()}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[1]);
      });

      expect(screen.getByText("client_card.edit_address")).toBeInTheDocument();
    });

    it("pre-fills edit address dialog with current address values", async () => {
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={jest.fn()}
          onAddressSubmit={jest.fn()}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[1]);
      });

      expect(screen.getByLabelText(/client_card\.line1/i)).toHaveValue(
        "123 Main St"
      );
      expect(screen.getByLabelText(/client_card\.city/i)).toHaveValue(
        "New York"
      );
    });

    it("calls onAddressSubmit with updated values on save", async () => {
      const onAddressSubmit = jest.fn();
      render(
        <ClientCard
          client={mockClient}
          address={mockAddress}
          onClientSubmit={jest.fn()}
          onAddressSubmit={onAddressSubmit}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[1]);
      });

      const cityField = screen.getByLabelText(/client_card\.city/i);
      await act(async () => {
        await userEvent.clear(cityField);
        await userEvent.type(cityField, "Los Angeles");
        await userEvent.click(
          screen.getByRole("button", { name: /client_card\.save/i })
        );
      });

      expect(onAddressSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ city: "Los Angeles" })
      );
    });

    it("does not call onAddressSubmit when required fields are empty", async () => {
      const onAddressSubmit = jest.fn();
      render(
        <ClientCard
          client={mockClient}
          address={{ ...mockAddress, line1: "" }}
          onClientSubmit={jest.fn()}
          onAddressSubmit={onAddressSubmit}
        />
      );

      const editButtons = screen.getAllByRole("button");
      await act(async () => {
        await userEvent.click(editButtons[1]);
      });

      await act(async () => {
        await userEvent.click(
          screen.getByRole("button", { name: /client_card\.save/i })
        );
      });

      expect(onAddressSubmit).not.toHaveBeenCalled();
    });
  });
});
