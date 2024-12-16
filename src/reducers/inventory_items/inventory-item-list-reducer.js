/**
 * Copyright 2024 OpenStack Foundation
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
  RECEIVE_INVENTORY_ITEMS,
  REQUEST_INVENTORY_ITEMS,
  INVENTORY_ITEM_DELETED,
  CHANGE_INVENTORY_ITEM_SEARCH_TERM
} from "../../actions/inventory-item-actions";

const DEFAULT_STATE = {
  inventoryItems: [],
  term: null,
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalInventoryItems: 0,
  filters: {}
};

const inventoryItemListReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_INVENTORY_ITEMS: {
      const { order, orderDir, page, ...rest } = payload;

      if (
        order !== state.order ||
        orderDir !== state.orderDir ||
        page !== state.currentPage
      ) {
        // if the change was in page or order, keep selection
        return {
          ...state,
          order,
          orderDir,
          currentPage: page,
          ...rest
        };
      }

      return {
        ...state,
        order,
        orderDir,
        inventoryItems: [],
        currentPage: page,
        ...rest
      };
    }
    case RECEIVE_INVENTORY_ITEMS: {
      const { current_page, total, last_page } = payload.response;

      const inventoryItems = payload.response.data.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name
        }));

      return {
        ...state,
        inventoryItems,
        currentPage: current_page,
        totalInventoryItems: total,
        lastPage: last_page
      };
    }
    case INVENTORY_ITEM_DELETED: {
      const { inventoryItemId } = payload;
      return {
        ...state,
        inventoryItems: state.inventoryItems.filter(
          (a) => a.id !== inventoryItemId
        )
      };
    }
    case CHANGE_INVENTORY_ITEM_SEARCH_TERM: {
      const { term } = payload;
      return { ...state, term };
    }
    default:
      return state;
  }
};

export default inventoryItemListReducer;
