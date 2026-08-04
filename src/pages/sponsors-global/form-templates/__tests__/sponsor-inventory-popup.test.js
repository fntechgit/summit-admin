import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SponsorItemDialog from "../sponsor-inventory-popup";

jest.mock("i18n-react/dist/i18n-react", () => ({
  translate: jest.fn((key) => key)
}));

jest.mock("../../../../hooks/useScrollToError", () => jest.fn());

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/upload",
  () =>
    function MockMuiFormikUpload({ name }) {
      return <div data-testid={`upload-${name}`} />;
    }
);

jest.mock(
  "openstack-uicore-foundation/lib/components/mui/formik-inputs/additional-input-list",
  () =>
    function MockAdditionalInputList({ name }) {
      return <div data-testid={`meta-fields-${name}`} />;
    }
);

jest.mock(
  "../../../../components/mui/formik-inputs/item-price-tiers",
  () =>
    function MockItemPriceTiers() {
      return <div data-testid="price-tiers" />;
    }
);

jest.mock(
  "../../../../components/inputs/formik-text-editor",
  () =>
    function MockFormikTextEditor({ name }) {
      return <textarea data-testid={`editor-${name}`} name={name} readOnly />;
    }
);

const BASE_ENTITY = {
  id: 0,
  code: "",
  name: "",
  description: "",
  early_bird_rate: "",
  standard_rate: "",
  onsite_rate: "",
  quantity_limit_per_show: "",
  quantity_limit_per_sponsor: "",
  meta_fields: [],
  images: []
};

const fillRequiredTextFields = async (user) => {
  await user.type(document.querySelector("input[name=\"code\"]"), "CODE-1");
  await user.type(document.querySelector("input[name=\"name\"]"), "Item 1");
};

const submit = async (user) => {
  await user.click(
    screen.getByRole("button", { name: "edit_inventory_item.save_changes" })
  );
};

describe("SponsorItemDialog", () => {
  let onSave;
  let onClose;

  beforeEach(() => {
    jest.clearAllMocks();
    onSave = jest.fn(() => Promise.resolve());
    onClose = jest.fn();
  });

  it("titles itself by whether the entity has an id", () => {
    const { rerender } = render(
      <SponsorItemDialog
        entity={BASE_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(
      screen.getByText("edit_inventory_item.new_item")
    ).toBeInTheDocument();

    rerender(
      <SponsorItemDialog
        entity={{ ...BASE_ENTITY, id: 42 }}
        onSave={onSave}
        onClose={onClose}
      />
    );
    expect(
      screen.getByText("edit_inventory_item.edit_item")
    ).toBeInTheDocument();
  });

  it("blocks save when code/name are empty", async () => {
    const user = userEvent.setup();
    render(
      <SponsorItemDialog
        entity={BASE_ENTITY}
        onSave={onSave}
        onClose={onClose}
      />
    );

    await submit(user);

    expect(onSave).not.toHaveBeenCalled();
  });

  describe("default_quantity requirement", () => {
    it("is optional by default: saves with no value and shows no required marker", async () => {
      const user = userEvent.setup();
      render(
        <SponsorItemDialog
          entity={BASE_ENTITY}
          onSave={onSave}
          onClose={onClose}
        />
      );

      expect(
        screen.queryByText("edit_inventory_item.default_quantity *")
      ).not.toBeInTheDocument();

      await fillRequiredTextFields(user);
      await submit(user);

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("blocks save, shows the error and the required marker when required and empty", async () => {
      const user = userEvent.setup();
      render(
        <SponsorItemDialog
          entity={{ ...BASE_ENTITY, default_quantity: undefined }}
          onSave={onSave}
          onClose={onClose}
          requireDefaultQuantity
        />
      );

      expect(
        screen.getByText("edit_inventory_item.default_quantity *")
      ).toBeInTheDocument();

      await fillRequiredTextFields(user);
      await submit(user);

      expect(onSave).not.toHaveBeenCalled();
      expect(
        await screen.findByText("validation.required")
      ).toBeInTheDocument();
    });

    it("allows save once a value is provided when required", async () => {
      const user = userEvent.setup();
      render(
        <SponsorItemDialog
          entity={{ ...BASE_ENTITY, default_quantity: "" }}
          onSave={onSave}
          onClose={onClose}
          requireDefaultQuantity
        />
      );

      await fillRequiredTextFields(user);
      await user.type(
        document.querySelector("input[name=\"default_quantity\"]"),
        "5"
      );
      await submit(user);

      await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
      expect(onSave.mock.calls[0][0]).toEqual(
        expect.objectContaining({ default_quantity: 5 })
      );
    });
  });
});
