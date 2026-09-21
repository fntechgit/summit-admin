/**
 * Copyright 2019 OpenStack Foundation
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */

import sponsorPageCartListReducer from "../sponsor-page-cart-list-reducer";
import { RECEIVE_CART_FORM } from "../../../actions/sponsor-cart-actions";

const DEFAULT_STATE = {
  cart: null,
  term: "",
  summitTZ: "",
  availableForms: {
    forms: [],
    lastPage: 1,
    total: 0,
    currentPage: 1,
    term: "",
    order: "id",
    orderDir: 1
  },
  sponsorForm: null,
  cartForm: null,
  paymentProfile: null,
  paymentIntent: null,
  offlinePayment: null,
  cartOwner: null
};

describe("sponsorPageCartListReducer", () => {
  describe("RECEIVE_CART_FORM", () => {
    it("populates every item field from the response, unmodified (cart form edit)", () => {
      const item = {
        form_item_id: 10,
        name: "Item A",
        notes: "some notes from the server",
        quantity: 2,
        default_quantity: 1,
        is_sold_out: false,
        remaining_quantity_sponsor: 5,
        meta_fields: [{ type_id: 1, class_field: "global", type: "Text" }]
      };

      const result = sponsorPageCartListReducer(DEFAULT_STATE, {
        type: RECEIVE_CART_FORM,
        payload: {
          response: {
            id: 1,
            name: "Form 1",
            items: [item]
          }
        }
      });

      expect(result.cartForm.items[0]).toEqual(item);
    });

    it("does not remap notes from a non-existent user_notes field", () => {
      const item = { form_item_id: 10, notes: "keep me", quantity: 1 };

      const result = sponsorPageCartListReducer(DEFAULT_STATE, {
        type: RECEIVE_CART_FORM,
        payload: {
          response: { id: 1, items: [item] }
        }
      });

      // Regression: an earlier version of this reducer overwrote notes with
      // `item.user_notes || ""`, which is always "" since items never carry
      // a user_notes field - silently blanking real notes on cart form edit.
      expect(result.cartForm.items[0].notes).toBe("keep me");
    });

    it("stores the response as-is when there are no items", () => {
      const result = sponsorPageCartListReducer(DEFAULT_STATE, {
        type: RECEIVE_CART_FORM,
        payload: {
          response: { id: 1, items: [] }
        }
      });

      expect(result.cartForm).toEqual({ id: 1, items: [] });
    });
  });
});
