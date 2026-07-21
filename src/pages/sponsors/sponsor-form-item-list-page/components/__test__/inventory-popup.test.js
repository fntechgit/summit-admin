import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InventoryPopup from "../sponsor-form-add-item-from-inventory-popup";

jest.mock("openstack-uicore-foundation/lib/utils/money", () => ({
  currencyAmountFromCents: jest.fn()
}));

describe("InventoryPopup", () => {
  const buildInventoryItems = (items = []) => ({
    inventoryItems: items,
    term: "",
    order: "",
    orderDir: "1",
    currentPage: 1,
    perPage: 10,
    totalInventoryItems: items.length
  });

  it("check if title is being rendered", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    const getInventoryItems = jest.fn();

    render(
      <InventoryPopup
        onClose={onClose}
        onSave={onSave}
        getInventoryItems={getInventoryItems}
        inventoryItems={buildInventoryItems()}
      />
    );

    const node = screen.getByText(
      "sponsor_form_item_list.add_from_inventory.title"
    );
    expect(node.textContent).toBe(
      "sponsor_form_item_list.add_from_inventory.title"
    );
  });

  it("check if close button calls close callback", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    const getInventoryItems = jest.fn();

    render(
      <InventoryPopup
        onClose={onClose}
        onSave={onSave}
        getInventoryItems={getInventoryItems}
        inventoryItems={buildInventoryItems()}
      />
    );

    const user = userEvent.setup();
    const node = screen.getByTestId("close-dialog");
    await user.click(node);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("check if close button clears selected rows", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    const getInventoryItems = jest.fn();

    render(
      <InventoryPopup
        onClose={onClose}
        onSave={onSave}
        getInventoryItems={getInventoryItems}
        inventoryItems={buildInventoryItems([
          {
            id: "123",
            code: "AAA",
            name: "My Item",
            early_bird_rate: "100",
            standard_rate: "100",
            onsite_rate: "100",
            hasImage: false,
            images: []
          },
          {
            id: "456",
            code: "AAAA",
            name: "My Item",
            early_bird_rate: "100",
            standard_rate: "100",
            onsite_rate: "100",
            hasImage: false,
            images: []
          }
        ])}
      />
    );

    const user = userEvent.setup();

    const checkboxNode = await screen.findAllByRole("checkbox");
    await user.click(checkboxNode[0]);

    const textNode = await screen.findByText("1 items selected");
    expect(textNode.textContent).toBe("1 items selected");

    const node = screen.getByTestId("close-dialog");
    await user.click(node);

    const textNode2 = screen.getByText("0 items selected");
    expect(textNode2.textContent).toBe("0 items selected");
  });
});
