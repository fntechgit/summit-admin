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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_FORM_TEMPLATE_ITEMS,
  REQUEST_FORM_TEMPLATE_ITEMS,
  FORM_TEMPLATE_ITEM_DELETED,
  CHANGE_FORM_TEMPLATE_ITEM_SEARCH_TERM,
  FORM_TEMPLATE_ITEM_ARCHIVED,
  FORM_TEMPLATE_ITEM_UNARCHIVED
} from "../../actions/form-template-item-actions";

const DEFAULT_STATE = {
  formTemplateItems: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalFormTemplateItems: 0,
  hideArchived: false
};

const formTemplateItemListReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_FORM_TEMPLATE_ITEMS: {
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
        formTemplateItems: [],
        currentPage: page,
        ...rest
      };
    }
    case RECEIVE_FORM_TEMPLATE_ITEMS: {
      const { current_page, total, last_page } = payload.response;

      const formTemplateItems = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        is_archived: a.is_archived,
        images: a.images
      }));

      return {
        ...state,
        formTemplateItems,
        currentPage: current_page,
        totalFormTemplateItems: total,
        lastPage: last_page
      };
    }
    case FORM_TEMPLATE_ITEM_DELETED: {
      const { formTemplateItemId } = payload;
      return {
        ...state,
        formTemplateItems: state.formTemplateItems.filter(
          (a) => a.id !== formTemplateItemId
        )
      };
    }
    case CHANGE_FORM_TEMPLATE_ITEM_SEARCH_TERM: {
      const { term } = payload;
      return { ...state, term };
    }
    case FORM_TEMPLATE_ITEM_ARCHIVED: {
      const updatedFormTemplateItem = payload.response;

      const updatedFormTemplatesItems = state.formTemplateItems.map((item) =>
        item.id === updatedFormTemplateItem.id
          ? { ...item, is_archived: true }
          : item
      );
      return { ...state, formTemplateItems: updatedFormTemplatesItems };
    }
    case FORM_TEMPLATE_ITEM_UNARCHIVED: {
      const updatedFormTemplateItemId = payload;

      const updatedFormTemplatesItems = state.formTemplateItems.map((item) =>
        item.id === updatedFormTemplateItemId
          ? { ...item, is_archived: false }
          : item
      );
      return { ...state, formTemplateItems: updatedFormTemplatesItems };
    }
    default:
      return state;
  }
};

export default formTemplateItemListReducer;
