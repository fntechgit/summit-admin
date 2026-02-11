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
import {
  RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEMS,
  REQUEST_SPONSOR_CUSTOMIZED_FORM_ITEMS,
  RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM,
  SPONSOR_CUSTOMIZED_FORM_ITEM_ARCHIVED,
  SPONSOR_CUSTOMIZED_FORM_ITEM_DELETED,
  SPONSOR_CUSTOMIZED_FORM_ITEM_UNARCHIVED,
  SPONSOR_FORM_MANAGED_ITEM_UPDATED,
  SPONSOR_CUSTOMIZED_FORM_ITEMS_ADDED,
  RESET_SPONSOR_FORM_MANAGED_ITEM
} from "../../actions/sponsor-forms-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_ITEM_ENTITY = {
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
};

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
  currentItem: DEFAULT_ITEM_ENTITY
};

const sponsorCustomizedFormItemsListReducer = (
  state = DEFAULT_STATE,
  action
) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_CUSTOMIZED_FORM_ITEMS: {
      const { term, order, orderDir, page, perPage, showArchived } = payload;

      return {
        ...state,
        term,
        order,
        orderDir,
        items: [],
        currentPage: page,
        perPage,
        showArchived
      };
    }
    case RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const items = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        early_bird_rate: currencyAmountFromCents(a.early_bird_rate),
        standard_rate: currencyAmountFromCents(a.standard_rate),
        onsite_rate: currencyAmountFromCents(a.onsite_rate),
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
    case RECEIVE_SPONSOR_CUSTOMIZED_FORM_ITEM: {
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
    case SPONSOR_CUSTOMIZED_FORM_ITEM_DELETED: {
      const { itemId } = payload;
      const items = state.items.filter((it) => it.id !== itemId);

      return { ...state, items };
    }
    case SPONSOR_CUSTOMIZED_FORM_ITEM_ARCHIVED: {
      const { id: itemId } = payload.response;

      const items = state.items.map((item) =>
        item.id === itemId ? { ...item, is_archived: true } : item
      );

      return { ...state, items };
    }
    case SPONSOR_CUSTOMIZED_FORM_ITEM_UNARCHIVED: {
      const { itemId } = payload;

      const items = state.items.map((item) =>
        item.id === itemId ? { ...item, is_archived: false } : item
      );

      return { ...state, items };
    }
    case SPONSOR_FORM_MANAGED_ITEM_UPDATED: {
      const updatedItem = payload.response;
      const items = state.items.map((item) =>
        item.id === updatedItem.id
          ? {
              id: updatedItem.id,
              code: updatedItem.code,
              name: updatedItem.name,
              early_bird_rate: currencyAmountFromCents(
                updatedItem.early_bird_rate
              ),
              standard_rate: currencyAmountFromCents(updatedItem.standard_rate),
              onsite_rate: currencyAmountFromCents(updatedItem.onsite_rate),
              default_quantity: updatedItem.default_quantity,
              is_archived: updatedItem.is_archived,
              images: updatedItem.images
            }
          : item
      );
      return { ...state, items };
    }
    case SPONSOR_CUSTOMIZED_FORM_ITEMS_ADDED: {
      return { ...state };
    }
    case RESET_SPONSOR_FORM_MANAGED_ITEM:
      return { ...state, currentItem: DEFAULT_ITEM_ENTITY };
    default:
      return state;
  }
};

export default sponsorCustomizedFormItemsListReducer;
