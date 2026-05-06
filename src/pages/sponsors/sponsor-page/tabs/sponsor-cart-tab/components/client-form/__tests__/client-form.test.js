import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ClientForm from "../index";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("openstack-uicore-foundation/lib/components", () => {
  const React = require("react");
  const { useField } = require("formik");
  return {
    MuiFormikTextField: ({ name, label, ...props }) => {
      const [field] = useField(name);
      return React.createElement("input", {
        "aria-label": label,
        id: name,
        ...field,
        ...props
      });
    }
  };
});

describe("ClientForm", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("renders full_name and email fields", () => {
    render(
      <ClientForm
        initialValues={{ full_name: "", email: "" }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/general\.full_name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/general\.email/i)).toBeInTheDocument();
  });

  it("pre-fills fields from initialValues", () => {
    render(
      <ClientForm
        initialValues={{ full_name: "Jane Doe", email: "jane@example.com" }}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/general\.full_name/i)).toHaveValue(
      "Jane Doe"
    );
    expect(screen.getByLabelText(/general\.email/i)).toHaveValue(
      "jane@example.com"
    );
  });

  it("calls onChange debounced when user types in full_name", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime.bind(jest)
    });
    render(
      <ClientForm
        initialValues={{ full_name: "", email: "" }}
        onChange={onChange}
      />
    );

    const fullNameField = screen.getByLabelText(/general\.full_name/i);
    await user.type(fullNameField, "John");
    act(() => jest.runAllTimers());

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: "John" })
    );
  });

  it("calls onChange debounced when user types in email", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime.bind(jest)
    });
    render(
      <ClientForm
        initialValues={{ full_name: "", email: "" }}
        onChange={onChange}
      />
    );

    const emailField = screen.getByLabelText(/general\.email/i);
    await user.type(emailField, "test@test.com");
    act(() => jest.runAllTimers());

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@test.com" })
    );
  });
});
