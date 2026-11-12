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
    default: ({ name }) => {
      // eslint-disable-next-line global-require
      const { useFormikContext } = require("formik");
      return useFormikContext().errors[name] ?? null;
    }
  })
);

jest.mock("../../../hooks/useScrollToError", () => ({
  __esModule: true,
  default: jest.fn()
}));

const ENTITY = { id: 3, name: "Card", description: "", is_default: null };

describe("ViewTypeForm", () => {
  it("shows server errors and submits the edited entity once while saving", async () => {
    const onSubmit = jest.fn(() => new Promise(() => {}));
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
      "Print"
    );
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        ...ENTITY,
        name: "CardPrint",
        is_default: true
      })
    );
    expect(screen.getByRole("button", { name: "general.save" })).toBeDisabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("blocks submit on values the API rejects", async () => {
    const onSubmit = jest.fn();
    const { rerender } = render(
      <ViewTypeForm
        entity={{ ...ENTITY, name: "Card Print" }}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "general.save" }));
    expect(
      await screen.findByText("validation.single_word")
    ).toBeInTheDocument();

    rerender(<ViewTypeForm entity={{ name: "Card" }} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "general.save" }));
    expect(await screen.findByText("validation.required")).toBeInTheDocument();

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
