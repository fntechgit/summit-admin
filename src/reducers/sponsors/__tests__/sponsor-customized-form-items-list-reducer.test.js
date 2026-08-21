import sponsorCustomizedFormItemsListReducer from "../sponsor-customized-form-items-list-reducer";
import {
  RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM,
  SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED,
  SPONSOR_FORM_MANAGED_ITEM_IMAGE_ADDED,
  SPONSOR_FORM_MANAGED_ITEM_UPDATED
} from "../../../actions/sponsor-forms-actions";

const DEFAULT_STATE = {
  items: [],
  showArchived: false,
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  currentItem: {
    code: "",
    name: "",
    description: "",
    early_bird_rate: 0,
    standard_rate: 0,
    onsite_rate: 0,
    quantity_limit_per_show: 0,
    quantity_limit_per_sponsor: 0,
    default_quantity: 0,
    images: [],
    meta_fields: []
  }
};

const buildItem = (overrides = {}) => ({
  id: 1,
  code: "ITEM1",
  name: "Item One",
  description: "desc",
  early_bird_rate: 100,
  standard_rate: 200,
  onsite_rate: 300,
  default_quantity: 5,
  is_archived: false,
  images: [],
  meta_fields: [],
  ...overrides
});

describe("sponsorCustomizedFormItemsListReducer", () => {
  describe("RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM", () => {
    it("stores images as received from the API, without a file_path mapping", () => {
      const result = sponsorCustomizedFormItemsListReducer(DEFAULT_STATE, {
        type: RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM,
        payload: {
          response: buildItem({
            images: [
              { id: 10, file_url: "https://cdn/a.png" },
              { id: 11, file_url: "https://cdn/b.png" }
            ]
          })
        }
      });

      expect(result.currentItem.images).toEqual([
        {
          id: 10,
          file_url: "https://cdn/a.png"
        },
        {
          id: 11,
          file_url: "https://cdn/b.png"
        }
      ]);
    });

    it("handles absent images without throwing", () => {
      const result = sponsorCustomizedFormItemsListReducer(DEFAULT_STATE, {
        type: RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM,
        payload: { response: buildItem({ images: undefined }) }
      });

      expect(result.currentItem.images).toEqual([]);
    });

    it("handles absent meta_fields without throwing — guards the .length access", () => {
      const result = sponsorCustomizedFormItemsListReducer(DEFAULT_STATE, {
        type: RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM,
        payload: { response: buildItem({ meta_fields: undefined }) }
      });

      expect(result.currentItem.meta_fields).toEqual([]);
    });
  });

  describe("SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED", () => {
    it("removes the image from currentItem and its matching list item", () => {
      const state = {
        ...DEFAULT_STATE,
        currentItem: {
          ...DEFAULT_STATE.currentItem,
          id: 1,
          images: [{ id: 10 }, { id: 11 }]
        },
        items: [
          buildItem({ id: 1, images: [{ id: 10 }, { id: 11 }] }),
          buildItem({ id: 2, images: [{ id: 12 }] })
        ]
      };

      const result = sponsorCustomizedFormItemsListReducer(state, {
        type: SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED,
        payload: { fileId: 10, itemId: 1 }
      });

      expect(result.currentItem.images).toEqual([{ id: 11 }]);
      expect(result.items[0].images).toEqual([{ id: 11 }]);
      expect(result.items[1].images).toEqual([{ id: 12 }]);
    });

    it("handles a currentItem with no images without throwing", () => {
      const state = {
        ...DEFAULT_STATE,
        currentItem: { ...DEFAULT_STATE.currentItem, id: 1, images: undefined },
        items: [buildItem({ id: 1, images: undefined })]
      };

      const result = sponsorCustomizedFormItemsListReducer(state, {
        type: SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED,
        payload: { fileId: 10, itemId: 1 }
      });

      expect(result.currentItem.images).toEqual([]);
    });

    it("leaves currentItem untouched when the deleted file belongs to a different item", () => {
      // Regression for the race where the delete for item A resolves after
      // the dialog switched to item B (RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM
      // replaced currentItem in between) — only A's row should update.
      const state = {
        ...DEFAULT_STATE,
        currentItem: {
          ...DEFAULT_STATE.currentItem,
          id: 2,
          images: [{ id: 12 }]
        },
        items: [
          buildItem({ id: 1, images: [{ id: 10 }, { id: 11 }] }),
          buildItem({ id: 2, images: [{ id: 12 }] })
        ]
      };

      const result = sponsorCustomizedFormItemsListReducer(state, {
        type: SPONSOR_CUSTOMIZED_FORM_ITEM_IMAGE_DELETED,
        payload: { fileId: 10, itemId: 1 }
      });

      expect(result.currentItem).toEqual(state.currentItem);
      expect(result.items[0].images).toEqual([{ id: 11 }]);
      expect(result.items[1].images).toEqual([{ id: 12 }]);
    });
  });

  describe("SPONSOR_FORM_MANAGED_ITEM_IMAGE_ADDED", () => {
    it.each([
      [
        "with existing images",
        [{ id: 10 }],
        { id: 11 },
        [{ id: 10 }, { id: 11 }]
      ],
      ["with no images (undefined)", undefined, { id: 10 }, [{ id: 10 }]]
    ])(
      "appends the new image to currentItem and its matching list item (%s)",
      (_label, initialImages, newImage, expectedImages) => {
        const state = {
          ...DEFAULT_STATE,
          currentItem: {
            ...DEFAULT_STATE.currentItem,
            id: 1,
            images: initialImages
          },
          items: [
            buildItem({ id: 1, images: initialImages }),
            buildItem({ id: 2, images: [{ id: 12 }] })
          ]
        };

        const result = sponsorCustomizedFormItemsListReducer(state, {
          type: SPONSOR_FORM_MANAGED_ITEM_IMAGE_ADDED,
          payload: { response: newImage, itemId: 1 }
        });

        expect(result.currentItem.images).toEqual(expectedImages);
        expect(result.items[0].images).toEqual(expectedImages);
        expect(result.items[1].images).toEqual([{ id: 12 }]);
      }
    );

    it("leaves currentItem untouched when the new image belongs to a different item", () => {
      // This is exactly the case that broke before this action got its own
      // type: an image upload response ({id, file_url}) used to be dispatched
      // as SPONSOR_FORM_MANAGED_ITEM_UPDATED, which that reducer case reads
      // as an item - matching state.items by the image's id and clobbering
      // whichever unrelated item happened to share that numeric id.
      const state = {
        ...DEFAULT_STATE,
        currentItem: {
          ...DEFAULT_STATE.currentItem,
          id: 2,
          images: [{ id: 12 }]
        },
        items: [
          buildItem({ id: 1, images: [{ id: 10 }] }),
          buildItem({ id: 2, images: [{ id: 12 }] })
        ]
      };

      const result = sponsorCustomizedFormItemsListReducer(state, {
        type: SPONSOR_FORM_MANAGED_ITEM_IMAGE_ADDED,
        payload: { response: { id: 11 }, itemId: 1 }
      });

      expect(result.currentItem).toEqual(state.currentItem);
      expect(result.items[0].images).toEqual([{ id: 10 }, { id: 11 }]);
      expect(result.items[1].images).toEqual([{ id: 12 }]);
    });
  });

  describe("SPONSOR_FORM_MANAGED_ITEM_UPDATED", () => {
    it("replaces the matching list item and preserves its images as-is", () => {
      const images = [{ id: 20, file_url: "https://cdn/img.png" }];
      const state = {
        ...DEFAULT_STATE,
        items: [
          buildItem({ id: 1, name: "Before", images }),
          buildItem({ id: 2, name: "Other" })
        ]
      };

      const result = sponsorCustomizedFormItemsListReducer(state, {
        type: SPONSOR_FORM_MANAGED_ITEM_UPDATED,
        payload: {
          response: buildItem({
            id: 1,
            name: "After",
            early_bird_rate: 500,
            standard_rate: 600,
            onsite_rate: 700,
            images
          })
        }
      });

      expect(result.items[0].name).toBe("After");
      expect(result.items[0].images).toBe(images);
      expect(result.items[1].name).toBe("Other");
    });

    it("preserves the existing item's images when the response omits them", () => {
      // Regression for the handleCellEdit path (sponsor-forms-manage-items.js)
      // which saves via this action with no follow-up refetch - a response
      // that omits images must not clobber the row's thumbnail.
      const images = [{ id: 20, file_url: "https://cdn/img.png" }];
      const state = {
        ...DEFAULT_STATE,
        items: [buildItem({ id: 1, name: "Before", images })]
      };

      const result = sponsorCustomizedFormItemsListReducer(state, {
        type: SPONSOR_FORM_MANAGED_ITEM_UPDATED,
        payload: {
          response: buildItem({
            id: 1,
            name: "After",
            early_bird_rate: 500,
            images: undefined
          })
        }
      });

      expect(result.items[0].name).toBe("After");
      expect(result.items[0].images).toBe(images);
    });
  });
});
