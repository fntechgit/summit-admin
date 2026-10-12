import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import ViewTypeForm from "../view-type-form";

jest.mock("i18n-react/dist/i18n-react", () => ({
  __esModule: true,
  default: { translate: (key) => key }
}));

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/texteditor",
  () => ({
    __esModule: true,
    default: () => null
  })
);

jest.mock("../../../hooks/useScrollToError", () => ({
  __esModule: true,
  default: jest.fn()
}));

const ENTITY = { id: 3, name: "Card", description: "", is_default: null };

describe("ViewTypeForm", () => {
  it("shows server errors and submits the edited entity", async () => {
    const onSubmit = jest.fn();
    render(
      <ViewTypeForm
        entity={ENTITY}
        errors={{ name: "name taken" }}
        onSubmit={onSubmit}
      />
    );

    expect(await screen.findByText("name taken")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: /edit_view_type.name/ }),
      " Print"
    );
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        ...ENTITY,
        name: "Card Print",
        is_default: true
      })
    );
  });

  it("blocks submit when name is empty", async () => {
    const onSubmit = jest.fn();
    render(
      <ViewTypeForm entity={{ ...ENTITY, name: "" }} onSubmit={onSubmit} />
    );

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    expect(await screen.findByText("validation.required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
