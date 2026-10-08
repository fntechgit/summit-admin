import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import BadgeTypeForm from "../badge-type-form";

// jsdom has no scrollIntoView; scrollToError calls it for the name error
window.HTMLElement.prototype.scrollIntoView = jest.fn();

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../mui/link-list", () => ({
  __esModule: true,
  default: () => null
}));

const ENTITY = {
  id: 7,
  name: "Attendee",
  description: "",
  is_default: 0,
  access_levels: [],
  badge_features: [],
  allowed_view_types: []
};

describe("BadgeTypeForm", () => {
  it("clears a field error on edit and submits the edited entity", async () => {
    const onSubmit = jest.fn();
    render(
      <BadgeTypeForm
        entity={ENTITY}
        currentSummit={{}}
        errors={{ name: "name taken" }}
        onAccessLevelLink={jest.fn()}
        onAccessLevelUnLink={jest.fn()}
        onFeatureLink={jest.fn()}
        onFeatureUnLink={jest.fn()}
        onViewTypeLink={jest.fn()}
        onViewTypeUnLink={jest.fn()}
        onSubmit={onSubmit}
      />
    );
    const name = screen.getByRole("textbox", { name: /edit_badge_type.name/ });

    expect(screen.getByText("name taken")).toBeInTheDocument();
    await userEvent.type(name, " VIP");
    expect(screen.queryByText("name taken")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(onSubmit).toHaveBeenCalledWith({
      ...ENTITY,
      name: "Attendee VIP",
      is_default: true
    });
  });
});
