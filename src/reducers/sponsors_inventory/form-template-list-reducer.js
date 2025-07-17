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
  REQUEST_FORM_TEMPLATES,
  RECEIVE_FORM_TEMPLATES,
  FORM_TEMPLATE_DELETED,
  CHANGE_FORM_TEMPLATE_SEARCH_TERM,
  FORM_TEMPLATE_ARCHIVED,
  FORM_TEMPLATE_UNARCHIVED
} from "../../actions/form-template-actions";

const DEFAULT_STATE = {
  formTemplates: [],
  term: null,
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalFormTemplates: 0,
  filters: {}
};

const formTemplateListReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_FORM_TEMPLATES: {
      const { order, orderDir, page, perPage, ...rest } = payload;

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
        formTemplates: [],
        currentPage: page,
        perPage,
        ...rest
      };
    }
    case RECEIVE_FORM_TEMPLATES: {
      const { current_page, total, last_page } = payload.response;

      const formTemplates = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        items_qty: `${a.items.length} ${
          a.items.length === 1 ? "Item" : "Items"
        }`,
        is_archived: a.is_archived
      }));

      return {
        ...state,
        formTemplates,
        currentPage: current_page,
        totalFormTemplates: total,
        lastPage: last_page
      };
    }
    case FORM_TEMPLATE_DELETED: {
      const { formTemplateId } = payload;
      return {
        ...state,
        formTemplates: state.formTemplates.filter(
          (a) => a.id !== formTemplateId
        )
      };
    }
    case FORM_TEMPLATE_ARCHIVED: {
      const updatedFormTemplate = payload.response;

      const updatedFormTemplates = state.formTemplates.map((item) =>
        item.id === updatedFormTemplate.id
          ? { ...item, is_archived: true }
          : item
      );
      return { ...state, formTemplates: updatedFormTemplates };
    }
    case FORM_TEMPLATE_UNARCHIVED: {
      const updatedFormTemplateId = payload;

      const updatedFormTemplates = state.formTemplates.map((item) =>
        item.id === updatedFormTemplateId
          ? { ...item, is_archived: false }
          : item
      );
      return { ...state, formTemplates: updatedFormTemplates };
    }
    case CHANGE_FORM_TEMPLATE_SEARCH_TERM: {
      const { term } = payload;
      return { ...state, term };
    }
    default:
      return state;
  }
};

export default formTemplateListReducer;
