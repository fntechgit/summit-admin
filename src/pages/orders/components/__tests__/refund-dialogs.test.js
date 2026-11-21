import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import RefundTicketDialog from "../refund-ticket-dialog";
import RejectRefundDialog from "../reject-refund-dialog";
import showConfirmDialog from "../../../../components/mui/showConfirmDialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../../../components/mui/showConfirmDialog", () => jest.fn());

const pending = () => {
  let reject;
  const promise = new Promise((_resolve, rej) => {
    reject = rej;
  });
  return { promise, reject };
};

const button = (name) => screen.getByRole("button", { name });

describe("RefundTicketDialog", () => {
  const renderDialog = (onRefund = jest.fn(), onClose = jest.fn()) => {
    render(
      <RefundTicketDialog
        currencySymbol="$"
        netSellingCost={50.3}
        refundedAmount={20.1}
        onRefund={onRefund}
        onClose={onClose}
      />
    );
    return { onRefund, onClose };
  };

  const submitAmount = async (value) => {
    const amount = document.getElementById("refundAmount");
    await userEvent.clear(amount);
    await userEvent.type(amount, value);
    await userEvent.click(button("edit_ticket.refund"));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    showConfirmDialog.mockResolvedValue(true);
  });

  test("rejects amounts that are not positive, have over two decimals or exceed net cost minus refunded", async () => {
    const { onRefund } = renderDialog();

    await submitAmount("30.21");
    expect(
      await screen.findByText("edit_ticket.refund_amount_error")
    ).toBeInTheDocument();
    await submitAmount("1.234");
    expect(
      await screen.findByText("validation.two_decimals")
    ).toBeInTheDocument();
    await submitAmount("0");
    expect(await screen.findByText("validation.positive")).toBeInTheDocument();

    expect(showConfirmDialog).not.toHaveBeenCalled();
    expect(onRefund).not.toHaveBeenCalled();
  });

  test("refunds after confirmation, stays open on error and closes on success", async () => {
    const first = pending();
    const { onRefund, onClose } = renderDialog(
      jest.fn().mockReturnValueOnce(first.promise).mockResolvedValueOnce()
    );

    showConfirmDialog.mockResolvedValueOnce(false);
    // 50.3 - 20.1 is 30.199999999999996 in floats
    await submitAmount("30.2");
    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
    expect(onRefund).not.toHaveBeenCalled();

    await userEvent.click(button("edit_ticket.refund"));
    await waitFor(() => expect(onRefund).toHaveBeenCalledWith(30.2, ""));
    expect(button("edit_ticket.refund")).toBeDisabled();

    await act(async () => first.reject(new Error("api")));
    await waitFor(() => expect(button("edit_ticket.refund")).toBeEnabled());
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(button("edit_ticket.refund"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("RejectRefundDialog", () => {
  test("rejects with the notes after confirmation, stays open on error and closes on success", async () => {
    jest.clearAllMocks();
    showConfirmDialog.mockResolvedValue(true);
    const onReject = jest
      .fn()
      .mockRejectedValueOnce(new Error("api"))
      .mockResolvedValueOnce();
    const onClose = jest.fn();
    render(<RejectRefundDialog onReject={onReject} onClose={onClose} />);

    await userEvent.type(
      document.getElementById("refundRejectNotes"),
      "not eligible"
    );
    showConfirmDialog.mockResolvedValueOnce(false);
    await userEvent.click(button("edit_ticket.refund_reject"));
    await waitFor(() => expect(showConfirmDialog).toHaveBeenCalled());
    expect(onReject).not.toHaveBeenCalled();

    await userEvent.click(button("edit_ticket.refund_reject"));
    await waitFor(() =>
      expect(button("edit_ticket.refund_reject")).toBeEnabled()
    );
    expect(onReject).toHaveBeenCalledWith("not eligible");
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(button("edit_ticket.refund_reject"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
