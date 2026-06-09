import sponsorCustomizedFormReducer from "../sponsor-customized-form-reducer";
import {
  RECEIVE_SPONSOR_CUSTOMIZED_FORM,
  RESET_SPONSOR_CUSTOMIZED_FORM
} from "../../../actions/sponsor-forms-actions";

const DEFAULT_ENTITY = {
  id: 0,
  code: "",
  name: "",
  allowed_add_ons: [],
  opens_at: "",
  expires_at: "",
  instructions: "",
  meta_fields: [],
  items: []
};

const DEFAULT_STATE = { entity: DEFAULT_ENTITY };

describe("sponsorCustomizedFormReducer", () => {
  describe("RECEIVE_SPONSOR_CUSTOMIZED_FORM", () => {
    it("maps file_url to file_path for images on each item", () => {
      const result = sponsorCustomizedFormReducer(DEFAULT_STATE, {
        type: RECEIVE_SPONSOR_CUSTOMIZED_FORM,
        payload: {
          response: {
            id: 1,
            code: "FORM1",
            items: [
              {
                id: 10,
                name: "Item A",
                images: [
                  { id: 100, file_url: "https://example.com/img1.png" },
                  { id: 101, file_url: "https://example.com/img2.png" }
                ]
              }
            ]
          }
        }
      });

      expect(result.entity.items[0].images).toEqual([
        {
          id: 100,
          file_url: "https://example.com/img1.png",
          file_path: "https://example.com/img1.png"
        },
        {
          id: 101,
          file_url: "https://example.com/img2.png",
          file_path: "https://example.com/img2.png"
        }
      ]);
    });

    it("handles items with no images", () => {
      const result = sponsorCustomizedFormReducer(DEFAULT_STATE, {
        type: RECEIVE_SPONSOR_CUSTOMIZED_FORM,
        payload: {
          response: {
            id: 1,
            code: "FORM1",
            items: [{ id: 10, name: "Item A", images: [] }]
          }
        }
      });

      expect(result.entity.items[0].images).toEqual([]);
    });

    it("handles empty items array", () => {
      const result = sponsorCustomizedFormReducer(DEFAULT_STATE, {
        type: RECEIVE_SPONSOR_CUSTOMIZED_FORM,
        payload: {
          response: { id: 1, code: "FORM1", items: [] }
        }
      });

      expect(result.entity.items).toEqual([]);
    });

    it("handles missing items field", () => {
      const result = sponsorCustomizedFormReducer(DEFAULT_STATE, {
        type: RECEIVE_SPONSOR_CUSTOMIZED_FORM,
        payload: {
          response: { id: 1, code: "FORM1" }
        }
      });

      expect(result.entity.items).toEqual([]);
    });
  });

  describe("RESET_SPONSOR_CUSTOMIZED_FORM", () => {
    it("resets to default state", () => {
      const dirty = { entity: { id: 99, items: [{ id: 1 }] } };
      const result = sponsorCustomizedFormReducer(dirty, {
        type: RESET_SPONSOR_CUSTOMIZED_FORM
      });
      expect(result).toEqual(DEFAULT_STATE);
    });
  });
});
