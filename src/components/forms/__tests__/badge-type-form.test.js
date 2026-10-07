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
  name: "",
  description: "",
  is_default: 0,
  access_levels: [{ id: 1, name: "VIP" }],
  badge_features: [],
  allowed_view_types: []
};

const renderForm = (onSubmit = jest.fn()) => {
  const props = {
    entity: ENTITY,
    currentSummit: { badge_access_level_types: [], badge_features: [] },
    onAccessLevelLink: jest.fn(),
    onAccessLevelUnLink: jest.fn(),
    onFeatureLink: jest.fn(),
    onFeatureUnLink: jest.fn(),
    onViewTypeLink: jest.fn(),
    onViewTypeUnLink: jest.fn(),
    onSubmit
  };
  const { rerender } = render(<BadgeTypeForm {...props} />);
  return (entity) => rerender(<BadgeTypeForm {...props} entity={entity} />);
};

const nameInput = () =>
  screen.getByRole("textbox", { name: /edit_badge_type.name/ });
const descriptionInput = () =>
  screen.getByRole("textbox", { name: /edit_badge_type.description/ });

describe("BadgeTypeForm", () => {
  it("requires name and description, then submits them merged into the entity", async () => {
    const onSubmit = jest.fn();
    renderForm(onSubmit);
    const save = screen.getByRole("button", { name: "general.save" });

    await userEvent.click(save);
    expect(await screen.findAllByText("validation.required")).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.type(nameInput(), "Speaker");
    await userEvent.type(descriptionInput(), "Speaker badge");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(save);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        ...ENTITY,
        name: "Speaker",
        description: "Speaker badge",
        is_default: true
      })
    );
  });

  // linking/unlinking replaces the entity in the store; edits must survive it
  it("keeps unsaved edits when the linked items change", async () => {
    const updateEntity = renderForm();

    await userEvent.type(nameInput(), "Speaker");
    updateEntity({ ...ENTITY, access_levels: [] });

    expect(nameInput()).toHaveValue("Speaker");
  });
});
