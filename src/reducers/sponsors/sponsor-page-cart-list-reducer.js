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
  RECEIVE_CART_AVAILABLE_FORMS,
  RECEIVE_SPONSOR_CART,
  REQUEST_CART_AVAILABLE_FORMS,
  REQUEST_SPONSOR_CART,
  SPONSOR_CART_FORM_DELETED,
  SPONSOR_CART_FORM_LOCKED
} from "../../actions/sponsor-cart-actions";

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
  }
};

const mapForms = (formData) => ({
  id: formData.id,
  code: formData.code,
  name: formData.name,
  items: `${formData.items.length} items`
});

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
          return { ...form, is_locked };
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
    case REQUEST_CART_AVAILABLE_FORMS: {
      const { term, order, orderDir } = payload;
      return {
        ...state,
        availableForms: { ...state.availableForms, term, order, orderDir }
      };
    }
    case RECEIVE_CART_AVAILABLE_FORMS: {
      const {
        data,
        last_page: lastPage,
        total,
        current_page: currentPage
      } = payload.response;

      const forms =
        currentPage === 1
          ? data.map(mapForms)
          : [...state.availableForms.forms, ...data.map(mapForms)];

      const availableForms = {
        ...state.availableForms,
        forms,
        lastPage,
        total,
        currentPage
      };

      return { ...state, availableForms };
    }
    default:
      return state;
  }
};

export default sponsorPageCartListReducer;
