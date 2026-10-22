import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import BadgeTypeForm from "../badge-type-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock("../../mui/link-list", () => ({
  __esModule: true,
  default: () => null
}));

jest.mock("../../../hooks/useScrollToError", () => ({
  __esModule: true,
  default: jest.fn()
}));

const ENTITY = {
  id: 7,
  name: "Attendee",
  description: "Main badge",
  is_default: 0,
  access_levels: [],
  badge_features: [],
  allowed_view_types: []
};

const renderForm = (props) =>
  render(
    <BadgeTypeForm
      entity={ENTITY}
      currentSummit={{}}
      onAccessLevelLink={jest.fn()}
      onAccessLevelUnLink={jest.fn()}
      onFeatureLink={jest.fn()}
      onFeatureUnLink={jest.fn()}
      onViewTypeLink={jest.fn()}
      onViewTypeUnLink={jest.fn()}
      onSubmit={jest.fn()}
      {...props}
    />
  );

describe("BadgeTypeForm", () => {
  it("clears a server error on edit and submits the edited entity", async () => {
    const onSubmit = jest.fn();
    renderForm({ errors: { name: "name taken" }, onSubmit });
    const name = screen.getByRole("textbox", { name: /edit_badge_type.name/ });

    expect(await screen.findByText("name taken")).toBeInTheDocument();
    await userEvent.type(name, " VIP");
    expect(screen.queryByText("name taken")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        ...ENTITY,
        name: "Attendee VIP",
        is_default: true
      })
    );
  });

  it("blocks submit when required fields are empty", async () => {
    const onSubmit = jest.fn();
    renderForm({ entity: { ...ENTITY, name: "", description: "" }, onSubmit });

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(await screen.findAllByText("validation.required")).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
