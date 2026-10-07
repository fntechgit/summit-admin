import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Swal from "sweetalert2";
import AttendeeForm from "../attendee-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() }
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
jest.mock("../check-in-log-panel", () => ({
  __esModule: true,
  default: () => null
}));

// native select so the checked in dropdown can be driven from the test
jest.mock("openstack-uicore-foundation/lib/components/inputs/dropdown", () => ({
  __esModule: true,
  default: ({ id, value, onChange }) => (
    <select
      data-testid={id}
      value={String(value)}
      onChange={(ev) =>
        onChange({ target: { id, value: ev.target.value === "true" } })
      }
    >
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  )
}));

const defaultEntity = {
  id: 1,
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com",
  company: "Acme",
  shared_contact_info: false,
  summit_hall_checked_in: true,
  disclaimer_accepted: false,
  admin_notes: "",
  tags: [],
  tickets: [],
  orders: [],
  allowed_extra_questions: []
};

const renderForm = (onSubmit = jest.fn()) =>
  render(
    <AttendeeForm
      entity={defaultEntity}
      errors={{}}
      currentSummit={{ id: 1, time_zone_id: "UTC" }}
      onSubmit={onSubmit}
    />
  );

describe("AttendeeForm check out reason", () => {
  beforeEach(() => Swal.fire.mockReset());

  it("asks for a reason and submits it when checking out", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true, value: " left early " });
    const onSubmit = jest.fn();
    renderForm(onSubmit);

    await userEvent.selectOptions(
      screen.getByTestId("summit_hall_checked_in"),
      "false"
    );
    await waitFor(() =>
      expect(screen.getByTestId("summit_hall_checked_in")).toHaveValue("false")
    );
    expect(Swal.fire).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.summit_hall_checked_in).toBe(false);
    expect(payload.check_out_reason).toBe("left early");
  });

  it("keeps the attendee checked in when the prompt is cancelled", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: false });
    const onSubmit = jest.fn();
    renderForm(onSubmit);

    await userEvent.selectOptions(
      screen.getByTestId("summit_hall_checked_in"),
      "false"
    );
    await waitFor(() => expect(Swal.fire).toHaveBeenCalled());

    expect(screen.getByTestId("summit_hall_checked_in")).toHaveValue("true");

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).not.toHaveProperty("summit_hall_checked_in");
    expect(payload).not.toHaveProperty("check_out_reason");
  });

  it("drops the reason when the attendee is checked in again", async () => {
    Swal.fire.mockResolvedValue({ isConfirmed: true, value: "oops" });
    const onSubmit = jest.fn();
    renderForm(onSubmit);

    const select = screen.getByTestId("summit_hall_checked_in");
    await userEvent.selectOptions(select, "false");
    await waitFor(() => expect(select).toHaveValue("false"));
    await userEvent.selectOptions(select, "true");
    await waitFor(() => expect(select).toHaveValue("true"));

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("check_out_reason");
  });
});
