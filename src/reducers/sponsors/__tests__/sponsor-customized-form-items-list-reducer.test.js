import sponsorCustomizedFormItemsListReducer from "../sponsor-customized-form-items-list-reducer";
import {
  RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM,
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
    it("maps file_url to file_path on each image — the edit-form image fix", () => {
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
          file_url: "https://cdn/a.png",
          file_path: "https://cdn/a.png"
        },
        {
          id: 11,
          file_url: "https://cdn/b.png",
          file_path: "https://cdn/b.png"
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
  });
});
