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
  CHANGE_INVENTORY_ITEM_SEARCH_TERM,
  SELECT_INVENTORY_ITEM,
  UNSELECT_INVENTORY_ITEM,
  CLEAR_ALL_SELECTED_INVENTORY_ITEMS,
  SET_SELECTED_ALL_INVENTORY_ITEMS,
  INVENTORY_ITEM_ARCHIVED,
  INVENTORY_ITEM_UNARCHIVED,
  INVENTORY_ITEM_IMAGE_SAVED
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
  selectedCount: 0,
  selectedIds: [],
  excludedIds: [],
  selectedAll: false,
  showArchived: false
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
        name: a.name,
        images: a.images,
        is_archived: a.is_archived,
        early_bird_rate: a.early_bird_rate,
        standard_rate: a.standard_rate,
        onsite_rate: a.onsite_rate,
        checked: false
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
    case SELECT_INVENTORY_ITEM: {
      const {
        selectedAll,
        selectedIds,
        excludedIds,
        selectedCount,
        inventoryItems
      } = state;
      const itemId = payload;
      const item = inventoryItems.find((i) => i.id === itemId);
      item.checked = true;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedIds: excludedIds.filter((it) => it !== itemId),
          selectedIds: []
        };
      } else {
        newState = {
          ...state,
          selectedIds: [...selectedIds, itemId],
          excludedIds: []
        };
      }

      return { ...newState, inventoryItems, selectedCount: selectedCount + 1 };
    }
    case UNSELECT_INVENTORY_ITEM: {
      const { selectedAll, excludedIds, selectedCount, inventoryItems } = state;
      const itemId = payload;
      const item = inventoryItems.find((i) => i.id === itemId);
      item.checked = false;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedIds: [...excludedIds, itemId],
          selectedIds: []
        };
      } else {
        newState = {
          ...state,
          selectedIds: state.selectedIds.filter((it) => it !== itemId),
          excludedIds: []
        };
      }

      return { ...newState, inventoryItems, selectedCount: selectedCount - 1 };
    }
    case CLEAR_ALL_SELECTED_INVENTORY_ITEMS: {
      return {
        ...state,
        selectedIds: [],
        excludedIds: [],
        selectedCount: 0,
        selectedAll: false,
        inventoryItems: state.inventoryItems.map((a) => ({
          ...a,
          checked: false
        }))
      };
    }
    case SET_SELECTED_ALL_INVENTORY_ITEMS: {
      const selectedAll = payload;
      const inventoryItems = state.inventoryItems.map((a) => ({
        ...a,
        checked: selectedAll
      }));
      const selectedCount = selectedAll ? state.totalInventoryItems : 0;

      return {
        ...state,
        selectedAll,
        selectedIds: [],
        excludedIds: [],
        inventoryItems,
        selectedCount
      };
    }
    case INVENTORY_ITEM_ARCHIVED: {
      const updatedItem = payload.response;

      const updatedInventoryItems = state.inventoryItems.map((item) =>
        item.id === updatedItem.id ? { ...item, is_archived: true } : item
      );
      return { ...state, inventoryItems: updatedInventoryItems };
    }
    case INVENTORY_ITEM_UNARCHIVED: {
      const updatedItemId = payload;

      const updatedInventoryItems = state.inventoryItems.map((item) =>
        item.id === updatedItemId ? { ...item, is_archived: false } : item
      );
      return { ...state, inventoryItems: updatedInventoryItems };
    }
    case INVENTORY_ITEM_IMAGE_SAVED: {
      const newImage = payload.response;
      const imageArray = [{ ...newImage }];
      const updatedInventoryItems = state.inventoryItems.map((item) =>
        item.id === newImage.inventory_item_id
          ? { ...item, images: imageArray }
          : item
      );
      return { ...state, inventoryItems: updatedInventoryItems };
    }
    default:
      return state;
  }
};

export default inventoryItemListReducer;
