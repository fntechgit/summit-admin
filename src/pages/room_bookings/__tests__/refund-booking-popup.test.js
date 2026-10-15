import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import RefundBookingPopup from "../components/refund-booking-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

const booking = {
  id: 101,
  room_id: 7,
  owner_name: "John Doe",
  room_name: "Room 128",
  amount_str: "$100",
  currency: "USD"
};

describe("RefundBookingPopup", () => {
  test("rejects invalid amounts, locks the dialog while saving and closes only after a successful refund", async () => {
    const user = userEvent.setup();
    let rejectSave;
    const onSave = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectSave = reject;
          })
      )
      .mockResolvedValueOnce();
    const onClose = jest.fn();

    render(
      <RefundBookingPopup booking={booking} onClose={onClose} onSave={onSave} />
    );

    const amountInput = screen.getByRole("spinbutton");
    const submit = screen.getByRole("button", {
      name: "room_booking_list.refund"
    });
    const close = screen.getByRole("button", { name: "close" });

    await user.clear(amountInput);
    await user.type(amountInput, "-5");
    await user.click(submit);
    expect(
      await screen.findByText("validation.non_negative")
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    await user.clear(amountInput);
    await user.type(amountInput, "25");
    await user.click(submit);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(booking, 25));
    expect(submit).toBeDisabled();
    expect(close).toBeDisabled();

    await act(async () => rejectSave(new Error("refund failed")));
    await waitFor(() => expect(submit).toBeEnabled());
    expect(close).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();

    await user.click(submit);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});
