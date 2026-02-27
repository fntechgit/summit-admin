/**
 * Copyright 2026 OpenStack Foundation
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

import { amountFromCents } from "openstack-uicore-foundation/lib/utils/money";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_SPONSOR_FORM_ITEM,
  RECEIVE_SPONSOR_FORM_ITEMS,
  REQUEST_SPONSOR_FORM_ITEMS,
  RESET_SPONSOR_FORM_ITEM,
  SPONSOR_FORM_ITEM_ARCHIVED,
  SPONSOR_FORM_ITEM_DELETED,
  SPONSOR_FORM_ITEM_UNARCHIVED
} from "../../actions/sponsor-forms-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
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
    meta_fields: []
  }
};

const sponsorFormItemsListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_FORM_ITEMS: {
      const { order, orderDir, page, hideArchived } = payload;

      return {
        ...state,
        order,
        orderDir,
        items: [],
        currentPage: page,
        hideArchived
      };
    }
    case RECEIVE_SPONSOR_FORM_ITEMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const items = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        early_bird_rate: `$${amountFromCents(a.early_bird_rate)}`,
        standard_rate: `$${amountFromCents(a.standard_rate)}`,
        onsite_rate: `$${amountFromCents(a.onsite_rate)}`,
        default_quantity: a.default_quantity,
        is_archived: a.is_archived,
        images: a.images
      }));

      return {
        ...state,
        items,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    case RECEIVE_SPONSOR_FORM_ITEM: {
      const item = payload.response;

      const currentItem = {
        ...item,
        early_bird_rate: amountFromCents(item.early_bird_rate),
        standard_rate: amountFromCents(item.standard_rate),
        onsite_rate: amountFromCents(item.onsite_rate),
        meta_fields: item.meta_fields.length > 0 ? item.meta_fields : []
      };

      return { ...state, currentItem };
    }
    case RESET_SPONSOR_FORM_ITEM: {
      return { ...state, currentItem: DEFAULT_STATE.currentItem };
    }
    case SPONSOR_FORM_ITEM_DELETED: {
      const { itemId } = payload;
      const items = state.items.filter((it) => it.id !== itemId);

      return { ...state, items };
    }
    case SPONSOR_FORM_ITEM_ARCHIVED: {
      const { id: itemId } = payload.response;

      const items = state.items.map((item) =>
        item.id === itemId ? { ...item, is_archived: true } : item
      );

      return { ...state, items };
    }
    case SPONSOR_FORM_ITEM_UNARCHIVED: {
      const { itemId } = payload;

      const items = state.items.map((item) =>
        item.id === itemId ? { ...item, is_archived: false } : item
      );

      return { ...state, items };
    }
    default:
      return state;
  }
};

export default sponsorFormItemsListReducer;
