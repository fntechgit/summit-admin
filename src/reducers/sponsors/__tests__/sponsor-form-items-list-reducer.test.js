import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import SponsorFormItemsListReducer from "../sponsor-form-items-list-reducer";
import { SET_CURRENT_SUMMIT } from "../../../actions/summit-actions";
import {
  RECEIVE_SPONSOR_FORM_ITEM,
  RECEIVE_SPONSOR_FORM_ITEMS,
  REQUEST_SPONSOR_FORM_ITEMS,
  RESET_SPONSOR_FORM_ITEM,
  SPONSOR_FORM_ITEM_ARCHIVED,
  SPONSOR_FORM_ITEM_DELETED,
  SPONSOR_FORM_ITEM_FILE_DELETED,
  SPONSOR_FORM_ITEM_UNARCHIVED
} from "../../../actions/sponsor-forms-actions";

function createDefaultState() {
  return {
    items: [],
    showArchived: false,
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
}

describe("SponsorFormItemsListReducer", () => {
  let initialState;
  let result;

  beforeEach(() => {
    initialState = createDefaultState();
    result = undefined;
  });

  describe("SET_CURRENT_SUMMIT", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(initialState, {
        type: SET_CURRENT_SUMMIT
      });
      expect(result).toStrictEqual(initialState);
    });
  });

  describe("LOGOUT_USER", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(initialState, { type: LOGOUT_USER });
      expect(result).toStrictEqual(initialState);
    });
  });

  describe("REQUEST_SPONSOR_FORM_ITEMS", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(initialState, {
        type: REQUEST_SPONSOR_FORM_ITEMS,
        payload: {
          order: "date",
          orderDir: 2,
          page: 10,
          perPage: 50,
          showArchived: true
        }
      });

      expect(result).toStrictEqual({
        ...initialState,
        order: "date",
        orderDir: 2,
        currentPage: 10,
        perPage: 50,
        showArchived: true,
        items: []
      });
    });
  });

  describe("RECEIVE_SPONSOR_FORM_ITEMS", () => {
    it("execution", () => {
      const items = [
        {
          id: "A",
          code: "A",
          name: "A",
          early_bird_rate: 100,
          standard_rate: 100,
          onsite_rate: 100,
          default_quantity: "100",
          is_archived: true,
          images: []
        },
        {
          id: "B",
          code: "B",
          name: "B",
          early_bird_rate: 100,
          standard_rate: 100,
          onsite_rate: 100,
          default_quantity: "100",
          is_archived: true,
          images: []
        }
      ];

      result = SponsorFormItemsListReducer(initialState, {
        type: RECEIVE_SPONSOR_FORM_ITEMS,
        payload: {
          response: {
            data: items,
            total: 2,
            current_page: 1,
            last_page: 2
          }
        }
      });

      expect(result).toStrictEqual({
        ...initialState,
        currentPage: 1,
        totalCount: 2,
        items: [
          {
            id: "A",
            code: "A",
            name: "A",
            early_bird_rate: "$1.00",
            standard_rate: "$1.00",
            onsite_rate: "$1.00",
            default_quantity: "100",
            is_archived: true,
            images: []
          },
          {
            id: "B",
            code: "B",
            name: "B",
            early_bird_rate: "$1.00",
            standard_rate: "$1.00",
            onsite_rate: "$1.00",
            default_quantity: "100",
            is_archived: true,
            images: []
          }
        ],
        lastPage: 2
      });
    });
  });

  describe("RECEIVE_SPONSOR_FORM_ITEM", () => {
    it("execution", () => {
      const item = {
        id: "A",
        code: "A",
        name: "A",
        early_bird_rate: 100,
        standard_rate: 100,
        onsite_rate: 100,
        default_quantity: "100",
        is_archived: true,
        images: [],
        meta_fields: []
      };

      result = SponsorFormItemsListReducer(initialState, {
        type: RECEIVE_SPONSOR_FORM_ITEM,
        payload: {
          response: item
        }
      });

      expect(result).toStrictEqual({
        ...initialState,
        currentItem: {
          ...item,
          meta_fields: []
        }
      });
    });

    it("keeps images in their API shape (id, file_url) without a file_path mapping", () => {
      const item = {
        id: "A",
        code: "A",
        name: "A",
        early_bird_rate: 100,
        standard_rate: 100,
        onsite_rate: 100,
        default_quantity: "100",
        is_archived: true,
        images: [
          { id: 10, file_url: "https://cdn/a.png" },
          { id: 11, file_url: "https://cdn/b.png" }
        ],
        meta_fields: []
      };

      result = SponsorFormItemsListReducer(initialState, {
        type: RECEIVE_SPONSOR_FORM_ITEM,
        payload: { response: item }
      });

      expect(result.currentItem.images).toEqual([
        { id: 10, file_url: "https://cdn/a.png" },
        { id: 11, file_url: "https://cdn/b.png" }
      ]);
    });

    it("defaults images to [] when the response omits the field", () => {
      const item = {
        id: "A",
        code: "A",
        name: "A",
        early_bird_rate: 100,
        standard_rate: 100,
        onsite_rate: 100,
        default_quantity: "100",
        is_archived: true,
        meta_fields: []
      };

      result = SponsorFormItemsListReducer(initialState, {
        type: RECEIVE_SPONSOR_FORM_ITEM,
        payload: { response: item }
      });

      expect(result.currentItem.images).toEqual([]);
    });
  });

  describe("RESET_SPONSOR_FORM_ITEM", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(initialState, {
        type: RESET_SPONSOR_FORM_ITEM
      });
      expect(result).toStrictEqual(initialState);
    });

    it("execution with a changed state", () => {
      result = SponsorFormItemsListReducer(
        {
          ...initialState,
          showArchived: true
        },
        { type: RESET_SPONSOR_FORM_ITEM }
      );
      expect(result).toStrictEqual({
        ...initialState,
        showArchived: true
      });
    });
  });

  describe("SPONSOR_FORM_ITEM_DELETED", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(
        {
          ...initialState,
          items: [
            {
              id: "A",
              code: "A",
              name: "A",
              early_bird_rate: "$1.00",
              standard_rate: "$1.00",
              onsite_rate: "$1.00",
              default_quantity: "100",
              is_archived: true,
              images: []
            },
            {
              id: "B",
              code: "B",
              name: "B",
              early_bird_rate: "$1.00",
              standard_rate: "$1.00",
              onsite_rate: "$1.00",
              default_quantity: "100",
              is_archived: true,
              images: []
            }
          ]
        },
        {
          type: SPONSOR_FORM_ITEM_DELETED,
          payload: { itemId: "A" }
        }
      );
      expect(result).toStrictEqual({
        ...initialState,
        items: [
          {
            id: "B",
            code: "B",
            name: "B",
            early_bird_rate: "$1.00",
            standard_rate: "$1.00",
            onsite_rate: "$1.00",
            default_quantity: "100",
            is_archived: true,
            images: []
          }
        ]
      });
    });
  });

  describe("SPONSOR_FORM_ITEM_FILE_DELETED", () => {
    it("removes the image from currentItem and its matching list item", () => {
      const state = {
        ...initialState,
        currentItem: {
          ...initialState.currentItem,
          id: "A",
          images: [{ id: "IMG_1" }, { id: "IMG_2" }]
        },
        items: [
          { id: "A", images: [{ id: "IMG_1" }, { id: "IMG_2" }] },
          { id: "B", images: [{ id: "IMG_3" }] }
        ]
      };

      result = SponsorFormItemsListReducer(state, {
        type: SPONSOR_FORM_ITEM_FILE_DELETED,
        payload: { fileId: "IMG_1", itemId: "A" }
      });

      expect(result.currentItem.images).toStrictEqual([{ id: "IMG_2" }]);
      expect(result.items).toStrictEqual([
        { id: "A", images: [{ id: "IMG_2" }] },
        { id: "B", images: [{ id: "IMG_3" }] }
      ]);
    });

    it("leaves currentItem untouched when the deleted file belongs to a different item", () => {
      const state = {
        ...initialState,
        currentItem: {
          ...initialState.currentItem,
          id: "B",
          images: [{ id: "IMG_3" }]
        },
        items: [
          { id: "A", images: [{ id: "IMG_1" }] },
          { id: "B", images: [{ id: "IMG_3" }] }
        ]
      };

      result = SponsorFormItemsListReducer(state, {
        type: SPONSOR_FORM_ITEM_FILE_DELETED,
        payload: { fileId: "IMG_1", itemId: "A" }
      });

      expect(result.currentItem).toStrictEqual(state.currentItem);
      expect(result.items).toStrictEqual([
        { id: "A", images: [] },
        { id: "B", images: [{ id: "IMG_3" }] }
      ]);
    });

    it("defaults the matching list item's images to [] when it has none", () => {
      const state = {
        ...initialState,
        currentItem: {
          ...initialState.currentItem,
          id: "A",
          images: undefined
        },
        items: [
          { id: "A", images: undefined },
          { id: "B", images: [{ id: "IMG_3" }] }
        ]
      };

      result = SponsorFormItemsListReducer(state, {
        type: SPONSOR_FORM_ITEM_FILE_DELETED,
        payload: { fileId: "IMG_1", itemId: "A" }
      });

      expect(result.currentItem.images).toStrictEqual([]);
      expect(result.items[0].images).toStrictEqual([]);
    });
  });

  describe("SPONSOR_FORM_ITEM_ARCHIVED", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(
        {
          ...initialState,
          totalCount: 2,
          items: [
            {
              id: "A",
              code: "A",
              name: "A",
              early_bird_rate: "$1.00",
              standard_rate: "$1.00",
              onsite_rate: "$1.00",
              default_quantity: "100",
              is_archived: false,
              images: []
            },
            {
              id: "B",
              code: "B",
              name: "B",
              early_bird_rate: "$1.00",
              standard_rate: "$1.00",
              onsite_rate: "$1.00",
              default_quantity: "100",
              is_archived: false,
              images: []
            }
          ]
        },
        {
          type: SPONSOR_FORM_ITEM_ARCHIVED,
          payload: {
            response: {
              id: "A"
            }
          }
        }
      );
      expect(result).toStrictEqual({
        ...initialState,
        totalCount: 2,
        items: [
          {
            id: "A",
            code: "A",
            name: "A",
            early_bird_rate: "$1.00",
            standard_rate: "$1.00",
            onsite_rate: "$1.00",
            default_quantity: "100",
            is_archived: true,
            images: []
          },
          {
            id: "B",
            code: "B",
            name: "B",
            early_bird_rate: "$1.00",
            standard_rate: "$1.00",
            onsite_rate: "$1.00",
            default_quantity: "100",
            is_archived: false,
            images: []
          }
        ]
      });
    });
  });

  describe("SPONSOR_FORM_ITEM_UNARCHIVED", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(
        {
          ...initialState,
          totalCount: 2,
          items: [
            {
              id: "A",
              code: "A",
              name: "A",
              early_bird_rate: "$1.00",
              standard_rate: "$1.00",
              onsite_rate: "$1.00",
              default_quantity: "100",
              is_archived: true,
              images: []
            },
            {
              id: "B",
              code: "B",
              name: "B",
              early_bird_rate: "$1.00",
              standard_rate: "$1.00",
              onsite_rate: "$1.00",
              default_quantity: "100",
              is_archived: false,
              images: []
            }
          ]
        },
        {
          type: SPONSOR_FORM_ITEM_UNARCHIVED,
          payload: {
            itemId: "A"
          }
        }
      );
      expect(result).toStrictEqual({
        ...initialState,
        totalCount: 2,
        items: [
          {
            id: "A",
            code: "A",
            name: "A",
            early_bird_rate: "$1.00",
            standard_rate: "$1.00",
            onsite_rate: "$1.00",
            default_quantity: "100",
            is_archived: false,
            images: []
          },
          {
            id: "B",
            code: "B",
            name: "B",
            early_bird_rate: "$1.00",
            standard_rate: "$1.00",
            onsite_rate: "$1.00",
            default_quantity: "100",
            is_archived: false,
            images: []
          }
        ]
      });
    });
  });

  describe("UNKNOWN_ACTION", () => {
    it("execution", () => {
      result = SponsorFormItemsListReducer(initialState, {
        type: "UNKNOWN_ACTION"
      });
      expect(result).toStrictEqual(initialState);
    });
  });
});
