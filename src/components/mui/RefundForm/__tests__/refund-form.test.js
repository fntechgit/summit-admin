import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import RefundForm from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("RefundForm", () => {
  it("renders reason and amount fields and submit button", () => {
    render(<RefundForm onSubmit={jest.fn()} />);
    expect(screen.getByLabelText(/refund_form\.reason/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /refund_form\.queue_refund/i })
    ).toBeInTheDocument();
  });

  it("calls onSubmit with reason and amount in cents", async () => {
    const onSubmit = jest.fn();
    render(<RefundForm onSubmit={onSubmit} />);

    const reasonField = screen.getByLabelText(/refund_form\.reason/i);
    const submitButton = screen.getByRole("button", {
      name: /refund_form\.queue_refund/i
    });

    await act(async () => {
      await userEvent.type(reasonField, "Duplicate charge");
      await userEvent.click(submitButton);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Duplicate charge" }),
      expect.anything()
    );
  });

  it("does not call onSubmit when reason is empty", async () => {
    const onSubmit = jest.fn();
    render(<RefundForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole("button", {
      name: /refund_form\.queue_refund/i
    });

    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
