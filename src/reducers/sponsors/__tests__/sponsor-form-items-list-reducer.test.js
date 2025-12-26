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
  SPONSOR_FORM_ITEM_UNARCHIVED
} from "../../../actions/sponsor-forms-actions";

function createDefaultState() {
  return {
    items: [],
    hideArchived: false,
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
      early_bird_rate: "",
      standard_rate: "",
      onsite_rate: "",
      quantity_limit_per_show: "",
      quantity_limit_per_sponsor: "",
      default_quantity: "",
      images: [],
      meta_fields: [
        {
          name: "",
          type: "Text",
          is_required: false,
          values: []
        }
      ]
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
          hideArchived: true
        }
      });

      expect(result).toStrictEqual({
        ...initialState,
        order: "date",
        orderDir: 2,
        currentPage: 10,
        hideArchived: true,
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
          early_bird_rate: "100",
          standard_rate: "100",
          onsite_rate: "100",
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
        early_bird_rate: "100",
        standard_rate: "100",
        onsite_rate: "100",
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
          early_bird_rate: "1.00",
          standard_rate: "1.00",
          onsite_rate: "1.00",
          meta_fields: [
            {
              name: "",
              type: "Text",
              is_required: false,
              values: []
            }
          ]
        }
      });
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
          hideArchived: true
        },
        { type: RESET_SPONSOR_FORM_ITEM }
      );
      expect(result).toStrictEqual({
        ...initialState,
        hideArchived: true
      });
    });
  });

  describe("SPONSOR_FORM_ITEM_DELETED", () => {
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
        totalCount: 1,
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
