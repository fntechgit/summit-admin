import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import TaxTypePopup from "../tax-type-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../../components/forms/tax-type-form", () => ({
  __esModule: true,
  default: ({ onSubmit, isSaving }) => (
    <button
      type="button"
      disabled={isSaving}
      onClick={() => onSubmit({ name: "VAT", rate: 20, tax_id: "V1" })}
    >
      submit-form
    </button>
  )
}));

const defaultProps = {
  entity: { id: 0, name: "", rate: "", tax_id: "", ticket_types: [] },
  currentSummit: { id: 1 },
  errors: {},
  onTicketLink: jest.fn(),
  onTicketUnLink: jest.fn()
};

describe("TaxTypePopup", () => {
  let onClose;
  let onSubmit;

  beforeEach(() => {
    onClose = jest.fn();
    onSubmit = jest.fn();
  });

  const renderPopup = (props = {}) =>
    render(
      <TaxTypePopup
        {...defaultProps}
        onClose={onClose}
        onSubmit={onSubmit}
        {...props}
      />
    );

  it("disables the submit button and X while onSubmit is pending", async () => {
    let resolveSave;
    onSubmit.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );

    renderPopup();
    await userEvent.click(screen.getByRole("button", { name: "submit-form" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "submit-form" })
      ).toBeDisabled();
    });
    expect(screen.getByTestId("CloseIcon").closest("button")).toBeDisabled();

    await act(async () => {
      resolveSave();
      await Promise.resolve();
    });
  });

  it("does not re-trigger onSubmit while a save is in flight", async () => {
    let resolveSave;
    onSubmit.mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      })
    );

    renderPopup();
    await userEvent.click(screen.getByRole("button", { name: "submit-form" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "submit-form" })).toBeDisabled()
    );

    await userEvent.click(screen.getByRole("button", { name: "submit-form" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave();
      await Promise.resolve();
    });
  });

  it("re-enables submit and does not call onClose when onSubmit rejects", async () => {
    onSubmit.mockImplementation(() => Promise.reject(new Error("API error")));

    renderPopup();
    await userEvent.click(screen.getByRole("button", { name: "submit-form" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "submit-form" })
      ).not.toBeDisabled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
