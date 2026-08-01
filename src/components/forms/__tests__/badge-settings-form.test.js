import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Swal from "sweetalert2";
import BadgeSettingsForm from "../badge-settings-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() }
}));

const mockSummit = { id: 1, badge_features_types: [], badge_types: [] };

const renderForm = (onSubmit) =>
  render(
    <BadgeSettingsForm
      entity={{}}
      currentSummit={mockSummit}
      errors={{}}
      onSubmit={onSubmit}
      onDeleteImage={jest.fn()}
      onDeleteBadgeTypeImage={jest.fn()}
    />
  );

it("should call onSubmit only once when Save is clicked twice while saving", async () => {
  const pendingPromise = new Promise(() => {});
  const onSubmit = jest.fn(() => pendingPromise);
  const { container } = renderForm(onSubmit);

  fireEvent.change(container.querySelector("#BADGE_TEMPLATE_WIDTH"), {
    target: { value: "100" }
  });

  const saveButton = screen.getByRole("button", { name: "general.save" });
  fireEvent.click(saveButton);
  fireEvent.click(saveButton);

  expect(onSubmit).toHaveBeenCalledTimes(1);
});

it("should re-enable Save and not throw an unhandled rejection when onSubmit rejects", async () => {
  const onSubmit = jest.fn(() => Promise.reject(new Error("412")));
  const { container } = renderForm(onSubmit);

  fireEvent.change(container.querySelector("#BADGE_TEMPLATE_WIDTH"), {
    target: { value: "100" }
  });

  fireEvent.click(screen.getByRole("button", { name: "general.save" }));

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: "general.save" })
    ).not.toBeDisabled();
  });
});

it("should not let a success-handler error be swallowed by onSubmit's rejection handler", () => {
  const then = jest.fn(() => ({ finally: jest.fn() }));
  const onSubmit = jest.fn(() => ({ then }));
  const { container } = renderForm(onSubmit);

  fireEvent.change(container.querySelector("#BADGE_TEMPLATE_WIDTH"), {
    target: { value: "100" }
  });
  fireEvent.click(screen.getByRole("button", { name: "general.save" }));

  // .then must receive two distinct handlers - a single-argument
  // .then(success).catch(fail) would let fail also catch success's own errors.
  expect(then).toHaveBeenCalledWith(expect.any(Function), expect.any(Function));
  const [onSuccess, onRejected] = then.mock.calls[0];
  expect(onSuccess).not.toBe(onRejected);

  Swal.fire.mockImplementationOnce(() => {
    throw new Error("Swal render error");
  });

  // invoking the success handler directly proves its own error is not
  // pre-caught before it would reach onRejected
  expect(onSuccess).toThrow("Swal render error");
});
