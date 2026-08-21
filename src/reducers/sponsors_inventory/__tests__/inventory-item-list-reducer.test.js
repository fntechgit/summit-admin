import inventoryItemListReducer from "../inventory-item-list-reducer";
import { INVENTORY_ITEM_IMAGE_DELETED } from "../../../actions/inventory-item-actions";

describe("inventoryItemListReducer", () => {
  describe("INVENTORY_ITEM_IMAGE_DELETED", () => {
    it("removes the deleted image from the matching item's images in the list", () => {
      const state = {
        inventoryItems: [
          { id: 1, images: [{ id: 10 }] },
          { id: 2, images: [{ id: 20 }] }
        ]
      };

      const result = inventoryItemListReducer(state, {
        type: INVENTORY_ITEM_IMAGE_DELETED,
        payload: { fileId: 10, inventoryItemId: 1 }
      });

      expect(result.inventoryItems).toEqual([
        { id: 1, images: [] },
        { id: 2, images: [{ id: 20 }] }
      ]);
    });

    it("leaves other items untouched when the deleted image belongs to a different item", () => {
      const state = {
        inventoryItems: [{ id: 1, images: [{ id: 10 }] }]
      };

      const result = inventoryItemListReducer(state, {
        type: INVENTORY_ITEM_IMAGE_DELETED,
        payload: { fileId: 999, inventoryItemId: 2 }
      });

      expect(result.inventoryItems).toEqual(state.inventoryItems);
    });
  });
});
