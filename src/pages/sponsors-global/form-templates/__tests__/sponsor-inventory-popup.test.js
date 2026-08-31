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
    function MockMuiFormikUpload({ name, onDelete }) {
      return (
        <div data-testid={`upload-${name}`}>
          <button type="button" onClick={() => onDelete(5)}>
            delete-persisted-image
          </button>
          <button type="button" onClick={() => onDelete(undefined)}>
            delete-unsaved-image
          </button>
        </div>
      );
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

  describe("image deletion", () => {
    it("calls onImageDeleted only for a persisted image (has an id)", async () => {
      const user = userEvent.setup();
      const onImageDeleted = jest.fn();
      render(
        <SponsorItemDialog
          entity={{ ...BASE_ENTITY, id: 42 }}
          onSave={onSave}
          onClose={onClose}
          onImageDeleted={onImageDeleted}
        />
      );

      await user.click(screen.getByText("delete-unsaved-image"));
      expect(onImageDeleted).not.toHaveBeenCalled();

      await user.click(screen.getByText("delete-persisted-image"));
      expect(onImageDeleted).toHaveBeenCalledWith(5);
      expect(onImageDeleted).toHaveBeenCalledTimes(1);
    });

    it("does nothing when onImageDeleted is not provided", async () => {
      const user = userEvent.setup();
      render(
        <SponsorItemDialog
          entity={{ ...BASE_ENTITY, id: 42 }}
          onSave={onSave}
          onClose={onClose}
        />
      );

      await expect(
        user.click(screen.getByText("delete-persisted-image"))
      ).resolves.not.toThrow();
    });
  });
});
