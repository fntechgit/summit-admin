import formTemplateItemListReducer from "../form-template-item-list-reducer";
import { FORM_TEMPLATE_ITEM_IMAGE_DELETED } from "../../../actions/form-template-item-actions";

describe("formTemplateItemListReducer", () => {
  describe("FORM_TEMPLATE_ITEM_IMAGE_DELETED", () => {
    it("removes the deleted image from the matching item's images in the list", () => {
      const state = {
        formTemplateItems: [
          { id: 1, images: [{ id: 10 }] },
          { id: 2, images: [{ id: 20 }] }
        ]
      };

      const result = formTemplateItemListReducer(state, {
        type: FORM_TEMPLATE_ITEM_IMAGE_DELETED,
        payload: { fileId: 10, formTemplateItemId: 1 }
      });

      expect(result.formTemplateItems).toEqual([
        { id: 1, images: [] },
        { id: 2, images: [{ id: 20 }] }
      ]);
    });

    it("leaves other items untouched when the deleted image belongs to a different item", () => {
      const state = {
        formTemplateItems: [{ id: 1, images: [{ id: 10 }] }]
      };

      const result = formTemplateItemListReducer(state, {
        type: FORM_TEMPLATE_ITEM_IMAGE_DELETED,
        payload: { fileId: 999, formTemplateItemId: 2 }
      });

      expect(result.formTemplateItems).toEqual(state.formTemplateItems);
    });
  });
});
