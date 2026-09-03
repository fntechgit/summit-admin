import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SponsorHeader from "../sponsor-header";

const buildSponsor = (overrides = {}) => ({
  id: 5,
  is_published: false,
  company: {
    name: "Acme Corp",
    city: "Austin",
    state: "TX",
    country: "USA",
    contact_email: "contact@acme.com"
  },
  ...overrides
});

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe("SponsorHeader", () => {
  it("renders sponsor info and the current publication state", () => {
    const sponsor = buildSponsor({ is_published: true });

    render(<SponsorHeader sponsor={sponsor} onSave={jest.fn()} />);

    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("edit_sponsor.is_published")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("saves the toggled value, disables controls while pending, blocks a second submit, and re-enables on resolve", async () => {
    const { promise, resolve } = deferred();
    const onSave = jest.fn(() => promise);
    const sponsor = buildSponsor({ id: 5, is_published: false });

    render(<SponsorHeader sponsor={sponsor} onSave={onSave} />);

    await userEvent.click(screen.getByRole("checkbox"));
    const saveButton = screen.getByRole("button", { name: "general.save" });
    await userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledWith({ id: 5, is_published: true });
    expect(saveButton).toBeDisabled();
    expect(screen.getByRole("checkbox")).toBeDisabled();

    // the button is disabled now, so a second click can't invoke the handler again
    fireEvent.click(saveButton);
    expect(onSave).toHaveBeenCalledTimes(1);

    resolve();
    await waitFor(() => expect(saveButton).toBeEnabled());
    expect(screen.getByRole("checkbox")).toBeEnabled();
  });

  it("re-enables controls and does not blow up when the save fails", async () => {
    const onSave = jest.fn().mockRejectedValue(new Error("save failed"));
    const sponsor = buildSponsor({ is_published: false });

    render(<SponsorHeader sponsor={sponsor} onSave={onSave} />);

    const saveButton = screen.getByRole("button", { name: "general.save" });
    await userEvent.click(saveButton);

    await waitFor(() => expect(saveButton).toBeEnabled());
    expect(screen.getByRole("checkbox")).toBeEnabled();
  });
});
