import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AuthButton from "../auth-button";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

describe("AuthButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("logged-in button calls initLogOut", async () => {
    const initLogOut = jest.fn();
    const doLogin = jest.fn();
    render(
      <AuthButton isLoggedUser initLogOut={initLogOut} doLogin={doLogin} />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "landing.sign_out" })
    );

    expect(initLogOut).toHaveBeenCalledTimes(1);
    expect(doLogin).not.toHaveBeenCalled();
  });

  test("logged-out button calls doLogin", async () => {
    const initLogOut = jest.fn();
    const doLogin = jest.fn();
    render(
      <AuthButton
        isLoggedUser={false}
        initLogOut={initLogOut}
        doLogin={doLogin}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "landing.log_in" })
    );

    expect(doLogin).toHaveBeenCalledTimes(1);
    expect(initLogOut).not.toHaveBeenCalled();
  });
});
