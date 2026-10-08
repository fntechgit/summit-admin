import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ViewTypeForm from "../view-type-form";

// jsdom has no scrollIntoView; scrollToError calls it for the name error
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/inputs/editor-input-v3",
  () => ({
    __esModule: true,
    default: () => null
  })
);

const ENTITY = { id: 3, name: "Card", description: "", is_default: null };

describe("ViewTypeForm", () => {
  it("clears a field error on edit and submits the edited entity", async () => {
    const onSubmit = jest.fn();
    render(
      <ViewTypeForm
        entity={ENTITY}
        errors={{ name: "name taken" }}
        onSubmit={onSubmit}
      />
    );
    const name = screen.getByRole("textbox", { name: /edit_view_type.name/ });

    expect(screen.getByText("name taken")).toBeInTheDocument();
    await userEvent.type(name, " Print");
    expect(screen.queryByText("name taken")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      ...ENTITY,
      name: "Card Print",
      is_default: true
    });
  });
});
