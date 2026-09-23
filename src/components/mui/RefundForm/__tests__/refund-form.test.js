import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
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
    const amountField = screen.getByLabelText(/refund_form\.amount/i);
    const submitButton = screen.getByRole("button", {
      name: /refund_form\.queue_refund/i
    });

    await act(async () => {
      await userEvent.type(reasonField, "Duplicate charge");
      await userEvent.type(amountField, "10");
      await userEvent.click(submitButton);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Duplicate charge", amount: 1000 }),
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

  const fillForm = async () => {
    await userEvent.type(
      screen.getByLabelText(/refund_form\.reason/i),
      "Duplicate charge"
    );
    await userEvent.type(screen.getByLabelText(/refund_form\.amount/i), "10");
  };

  it("submits only once when Enter is pressed repeatedly while the refund is pending", async () => {
    let resolveSubmit;
    const onSubmit = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        })
    );
    render(<RefundForm onSubmit={onSubmit} />);

    await act(async () => {
      await fillForm();
      await userEvent.keyboard("{Enter}{Enter}{Enter}{Enter}");
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: /refund_form\.queue_refund/i })
    ).toBeDisabled();

    await act(async () => {
      resolveSubmit();
    });
  });

  it("clears the form after a successful refund so Enter cannot resubmit it", async () => {
    const onSubmit = jest.fn(() => Promise.resolve());
    render(<RefundForm onSubmit={onSubmit} />);

    await act(async () => {
      await fillForm();
      await userEvent.keyboard("{Enter}");
    });

    await waitFor(() =>
      expect(screen.getByLabelText(/refund_form\.reason/i)).toHaveValue("")
    );

    await act(async () => {
      await userEvent.click(screen.getByLabelText(/refund_form\.reason/i));
      await userEvent.keyboard("{Enter}");
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("keeps the values and re-enables submit when the refund fails", async () => {
    const onSubmit = jest.fn(() => Promise.reject(new Error("boom")));
    render(<RefundForm onSubmit={onSubmit} />);

    await act(async () => {
      await fillForm();
      await userEvent.keyboard("{Enter}");
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /refund_form\.queue_refund/i })
      ).toBeEnabled()
    );
    expect(screen.getByLabelText(/refund_form\.reason/i)).toHaveValue(
      "Duplicate charge"
    );
  });
});
