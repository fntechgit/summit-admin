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
import {
  amountFromCents,
  currencyAmountFromCents
} from "openstack-uicore-foundation/lib/utils/money";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  RECEIVE_CART_AVAILABLE_FORMS,
  RECEIVE_CART_FORM,
  RECEIVE_CART_SPONSOR_FORM,
  RECEIVE_SPONSOR_CART,
  REQUEST_CART_AVAILABLE_FORMS,
  REQUEST_CART_FORM,
  REQUEST_CART_SPONSOR_FORM,
  REQUEST_SPONSOR_CART,
  SPONSOR_CART_FORM_DELETED,
  SPONSOR_CART_FORM_LOCKED,
  SPONSOR_CART_NOTE_ADDED,
  SPONSOR_CART_NOTE_DELETED,
  SPONSOR_CART_NOTE_UPDATED,
  OFFLINE_PAYMENT_CREATED,
  CART_STATUS_UPDATED,
  RECEIVE_PAYMENT_PROFILE,
  PAYMENT_INTENT_UPDATED,
  PAYMENT_INTENT_CREATED,
  PAYMENT_CONFIRMED,
  SPONSOR_CART_REOPENED
} from "../../actions/sponsor-cart-actions";
import { SPONSOR_CART_STATUS } from "../../utils/constants";
import { RECEIVE_MEMBER } from "../../actions/member-actions";
import { normalizeOrder } from "../../components/mui/OrderDetailsGrid/helpers";

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

const mapForm = (formData) => ({
  ...formData,
  item_count: `${formData.items.length} items`
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
    case CART_STATUS_UPDATED:
    case RECEIVE_SPONSOR_CART: {
      const cart = normalizeOrder(payload.response);

      return {
        ...state,
        cart
      };
    }
    case SPONSOR_CART_REOPENED: {
      return {
        ...state,
        cart: {
          ...state.cart,
          status: SPONSOR_CART_STATUS.OPEN,
        }
      }
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
        availableForms: { ...state.availableForms, term, order, orderDir },
        sponsorForm: null
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
          ? data.map(mapForm)
          : [...state.availableForms.forms, ...data.map(mapForm)];

      const availableForms = {
        ...state.availableForms,
        forms,
        lastPage,
        total,
        currentPage
      };

      return { ...state, availableForms };
    }
    case REQUEST_CART_SPONSOR_FORM: {
      return { ...state, sponsorForm: null };
    }
    case RECEIVE_CART_SPONSOR_FORM: {
      const sponsorForm = payload.response;
      return { ...state, sponsorForm };
    }
    case REQUEST_CART_FORM: {
      return { ...state, cartForm: null };
    }
    case RECEIVE_CART_FORM: {
      const cartForm = payload.response;

      return {
        ...state,
        cartForm: {
          ...cartForm,
          items: [
            ...cartForm.items.map((item) => ({
              ...item,
              notes: item.user_notes || ""
            }))
          ]
        }
      };
    }
    case SPONSOR_CART_NOTE_ADDED:
    case SPONSOR_CART_NOTE_UPDATED: {
      const note = payload.response;
      const newNotes = [
        ...state.cart.notes.filter((n) => n.id !== note.id),
        note
      ];
      return {
        ...state,
        cart: {
          ...state.cart,
          notes: newNotes
        }
      };
    }
    case SPONSOR_CART_NOTE_DELETED: {
      const { noteId } = payload;
      return {
        ...state,
        cart: {
          ...state.cart,
          notes: state.cart.notes.filter((n) => n.id !== noteId)
        }
      };
    }
    case RECEIVE_PAYMENT_PROFILE: {
      const paymentProfile = payload.response;
      return { ...state, paymentProfile };
    }
    case PAYMENT_INTENT_UPDATED:
    case PAYMENT_INTENT_CREATED: {
      const paymentIntent = payload.response;
      return { ...state, paymentIntent };
    }
    case PAYMENT_CONFIRMED: {
      return {
        ...state,
        cart: null,
        paymentProfile: null,
        paymentIntent: null,
        offlinePayment: null
      };
    }
    case OFFLINE_PAYMENT_CREATED: {
      const offlinePayment = payload.response;
      return { ...state, offlinePayment };
    }
    case RECEIVE_MEMBER: {
      const member = payload.response;
      return {
        ...state,
        cartOwner: {
          ...member,
          full_name: `${member.first_name} ${member.last_name}`
        }
      };
    }
    default:
      return state;
  }
};

export default sponsorPageCartListReducer;
