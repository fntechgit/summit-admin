import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithRedux } from "../../../../../utils/test-utils";
import InventoryPopup from "../sponsor-form-add-item-from-inventory-popup";

jest.mock("../../../../../actions/inventory-item-actions", () => ({
  getInventoryItems: jest.fn(() => ({
    type: "RECEIVE_INVENTORY_ITEMS",
    payload: {
      response: {
        data: [
          {
            id: "123",
            code: "AAA",
            name: "My Item",
            early_bird_rate: 1000,
            standard_rate: 1000,
            onsite_rate: 1000,
            is_archived: false
          },

          {
            id: "456",
            code: "AAAA",
            name: "My Item 2",
            early_bird_rate: 1000,
            standard_rate: 1000,
            onsite_rate: 1000,
            is_archived: false
          }
        ]
      },
      current_page: 1,
      total: 2,
      last_page: 1
    }
  }))
}));

describe("InventoryPopup", () => {
  it("check if title is being rendered", async () => {
    const formId = "AAA";
    const open = true;
    const onClose = jest.fn();

    const inventoryItems = {
      inventoryItems: [],
      term: 1,
      order: 1,
      orderDir: "A",
      currentPage: 1,
      perPag: 3,
      totalInventoryItems: 2
    };

    renderWithRedux(
      <InventoryPopup formId={formId} open={open} onClose={onClose} />,
      {
        initialState: {
          currentInventoryItemListState: {
            inventoryItems
          }
        }
      }
    );

    const node = screen.getByText(
      "sponsor_form_item_list.add_from_inventory.title"
    );
    expect(node.textContent).toBe(
      "sponsor_form_item_list.add_from_inventory.title"
    );
  });

  it("check if close button calls close callback", async () => {
    const formId = "AAA";
    const open = true;
    const onClose = jest.fn();

    const inventoryItems = {
      inventoryItems: [],
      term: 1,
      order: 1,
      orderDir: "A",
      currentPage: 1,
      perPag: 3,
      totalInventoryItems: 2
    };

    renderWithRedux(
      <InventoryPopup formId={formId} open={open} onClose={onClose} />,
      {
        initialState: {
          currentInventoryItemListState: {
            inventoryItems
          }
        }
      }
    );

    const user = userEvent.setup();
    const node = screen.getByTestId("CloseIcon");
    await user.click(node);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("check if close button clears selected rows", async () => {
    const formId = "AAA";
    const open = true;
    const onClose = jest.fn();

    renderWithRedux(
      <InventoryPopup formId={formId} open={open} onClose={onClose} />,
      {
        initialState: {
          currentInventoryItemListState: {
            inventoryItems: [
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
            ],
            term: "",
            order: "",
            orderDir: "1",
            currentPage: 1,
            perPage: 10,
            totalInventoryItems: 2
          }
        }
      }
    );

    const user = userEvent.setup();

    const checkboxNode = await screen.findAllByRole("checkbox");
    await user.click(checkboxNode[0]);

    const textNode = await screen.findByText("1 items selected");
    expect(textNode.textContent).toBe("1 items selected");

    const node = screen.getByTestId("CloseIcon");
    await user.click(node);

    const textNode2 = screen.getByText("0 items selected");
    expect(textNode2.textContent).toBe("0 items selected");
  });
});
