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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import { amountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  REQUEST_SPONSOR_CART,
  RECEIVE_SPONSOR_CART,
  SPONSOR_CART_FORM_DELETED,
  SPONSOR_CART_FORM_LOCKED
} from "../../actions/sponsor-cart-actions";

const DEFAULT_STATE = {
  cart: null,
  term: "",
  summitTZ: ""
};

const sponsorPageCartListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_CART: {
      const { term, summitTZ } = payload;

      return {
        ...state,
        cart: null,
        term,
        summitTZ
      };
    }
    case RECEIVE_SPONSOR_CART: {
      const cart = payload.response;
      cart.forms = cart.forms.map((form) => ({
        ...form,
        amount: amountFromCents(form.net_amount),
        discount: amountFromCents(form.discount_amount)
      }));
      cart.total = amountFromCents(cart.net_amount);

      return {
        ...state,
        cart
      };
    }
    case SPONSOR_CART_FORM_DELETED: {
      const { formId } = payload;
      const forms = state.cart.forms.filter((form) => form.id !== formId);

      return {
        ...state,
        cart: {
          ...state.cart,
          forms
        }
      };
    }
    case SPONSOR_CART_FORM_LOCKED: {
      const { formId, is_locked } = payload;

      const forms = state.cart.forms.map((form) => {
        if (form.id === formId) {
          return {...form, is_locked};
        }
        return form;
      });

      return {
        ...state,
        cart: {
          ...state.cart,
          forms
        }
      };
    }
    default:
      return state;
  }
};

export default sponsorPageCartListReducer;
