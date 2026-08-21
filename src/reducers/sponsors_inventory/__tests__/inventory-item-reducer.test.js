import inventoryItemReducer from "../inventory-item-reducer";
import { INVENTORY_ITEM_IMAGE_DELETED } from "../../../actions/inventory-item-actions";

describe("inventoryItemReducer", () => {
  describe("INVENTORY_ITEM_IMAGE_DELETED", () => {
    it("removes the deleted image by fileId from entity.images", () => {
      const state = {
        entity: {
          id: 1,
          images: [{ id: 10 }, { id: 11 }]
        }
      };

      const result = inventoryItemReducer(state, {
        type: INVENTORY_ITEM_IMAGE_DELETED,
        payload: { fileId: 10 }
      });

      expect(result.entity.images).toEqual([{ id: 11 }]);
    });
  });
});
