import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import AttendeeForm from "../attendee-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/member-input",
  () => ({ __esModule: true, default: () => null })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/attendee-input",
  () => ({ __esModule: true, default: () => null })
);

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/tag-input",
  () => ({ __esModule: true, default: () => null })
);

jest.mock("../../../notes/notes-panel", () => ({
  __esModule: true,
  default: () => null
}));

const SUMMIT = { id: 1, time_zone_id: "UTC" };

const defaultEntity = {
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  company: "Acme",
  shared_contact_info: false,
  summit_hall_checked_in: false,
  disclaimer_accepted: false,
  admin_notes: "",
  tags: [],
  tickets: [],
  orders: [],
  allowed_extra_questions: []
};

const renderForm = (entityOverride = {}, { onSubmit } = {}) =>
  render(
    <AttendeeForm
      entity={{ ...defaultEntity, ...entityOverride }}
      errors={{}}
      currentSummit={SUMMIT}
      onSubmit={onSubmit || jest.fn()}
    />
  );

describe("AttendeeForm", () => {
  it("blocks submit and shows required-field errors when no member and fields are blank", async () => {
    const onSubmit = jest.fn();
    renderForm({ first_name: "", last_name: "", email: "" }, { onSubmit });

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(screen.getAllByText("This field is required")).toHaveLength(3)
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a removeUnchangedFields-filtered payload when a field changes", async () => {
    const onSubmit = jest.fn();
    renderForm({}, { onSubmit });

    const firstNameInput = screen.getByDisplayValue("Jane");
    await userEvent.clear(firstNameInput);
    await userEvent.type(firstNameInput, "Janet");

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];

    expect(payload.first_name).toBe("Janet");
    expect(payload).not.toHaveProperty("last_name");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("company");
    expect(payload).not.toHaveProperty("shared_contact_info");
  });

  it("resyncs displayed fields when the entity prop changes", () => {
    const { rerender } = renderForm({ first_name: "Jane" });
    expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();

    rerender(
      <AttendeeForm
        entity={{ ...defaultEntity, first_name: "Alice" }}
        errors={{}}
        currentSummit={SUMMIT}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Jane")).not.toBeInTheDocument();
  });
});
