import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SponsorshipDialog from "../sponsorship-dialog";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock("../../../../hooks/useScrollToError", () => jest.fn());

const DEFAULT_ENTITY = { id: 0, name: "", label: "", size: "", order: 0 };

const EXISTING_ENTITY = {
  id: 5,
  name: "Platinum",
  label: "Plat",
  size: "Big",
  order: 1
};

describe("SponsorshipDialog", () => {
  const onSave = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should show the Add title for a new entity", () => {
    render(
      <SponsorshipDialog
        entity={DEFAULT_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(screen.getByText(/general\.add/i)).toBeInTheDocument();
  });

  it("should show the Edit title for an existing entity", () => {
    render(
      <SponsorshipDialog
        entity={EXISTING_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(screen.getByText(/general\.edit/i)).toBeInTheDocument();
  });

  it("should pre-fill fields with the existing entity values", () => {
    render(
      <SponsorshipDialog
        entity={EXISTING_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(screen.getByDisplayValue("Platinum")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Plat")).toBeInTheDocument();
  });

  it("should call onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <SponsorshipDialog
        entity={DEFAULT_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "close" }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show a required validation error when submitted without a name", async () => {
    const user = userEvent.setup();
    render(
      <SponsorshipDialog
        entity={DEFAULT_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );

    await act(async () => {
      await user.click(screen.getByText("general.save"));
    });

    expect(screen.getByText("validation.required")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("should call onSave with form values when submitted with a valid name", async () => {
    const user = userEvent.setup();
    render(
      <SponsorshipDialog
        entity={DEFAULT_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );

    await act(async () => {
      await user.type(screen.getByRole("textbox", { name: /name/i }), "Bronze");
    });

    await act(async () => {
      await user.click(screen.getByText("general.save"));
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Bronze" })
    );
  });
});
