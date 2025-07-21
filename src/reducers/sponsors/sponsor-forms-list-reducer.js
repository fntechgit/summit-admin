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
  RECEIVE_GLOBAL_SPONSORSHIPS,
  RECEIVE_GLOBAL_TEMPLATES,
  RECEIVE_SPONSOR_FORMS,
  REQUEST_GLOBAL_TEMPLATES,
  REQUEST_SPONSOR_FORMS,
  SPONSOR_FORM_ARCHIVED,
  SPONSOR_FORM_UNARCHIVED
} from "../../actions/sponsor-forms-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  sponsorForms: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  globalTemplates: {
    items: [],
    currentPage: 0,
    lastPage: 0,
    order: "id",
    orderDir: 1,
    term: "",
    total: 0
  },
  sponsorships: {
    items: [],
    currentPage: 0,
    lastPage: 0,
    total: 0
  }
};

const sponsorFormsListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_FORMS: {
      const { order, orderDir, page, term } = payload;

      return {
        ...state,
        order,
        orderDir,
        sponsorForms: [],
        currentPage: page,
        term
      };
    }
    case RECEIVE_SPONSOR_FORMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const sponsorForms = payload.response.data.map((a) => ({
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
        sponsorForms,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    case SPONSOR_FORM_ARCHIVED: {
      const { id: formId } = payload.response;

      const sponsorForms = state.sponsorForms.map((item) =>
        item.id === formId ? { ...item, is_archived: true } : item
      );

      return { ...state, sponsorForms };
    }
    case SPONSOR_FORM_UNARCHIVED: {
      const { formId } = payload;

      const sponsorForms = state.sponsorForms.map((item) =>
        item.id === formId ? { ...item, is_archived: false } : item
      );

      return { ...state, sponsorForms };
    }
    case REQUEST_GLOBAL_TEMPLATES: {
      const { order, orderDir, page, term } = payload;
      return {
        ...state,
        globalTemplates: {
          ...state.globalTemplates,
          order,
          orderDir,
          currentPage: page,
          term
        }
      };
    }
    case RECEIVE_GLOBAL_TEMPLATES: {
      const {
        current_page: currentPage,
        last_page: lastPage,
        total
      } = payload.response;

      const newTemplates = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        items_qty: `${a.items.length} ${
          a.items.length === 1 ? "Item" : "Items"
        }`
      }));

      const items =
        currentPage === 1
          ? newTemplates
          : [...state.globalTemplates.items, ...newTemplates];

      return {
        ...state,
        globalTemplates: {
          ...state.globalTemplates,
          items,
          currentPage,
          lastPage,
          total
        }
      };
    }
    case RECEIVE_GLOBAL_SPONSORSHIPS: {
      const {
        current_page: currentPage,
        last_page: lastPage,
        total,
        data
      } = payload.response;

      const newSponsorships = data.map((s) => ({
        id: s.id,
        name: s.type.name
      }));

      const items =
        currentPage === 1
          ? newSponsorships
          : [...state.sponsorships.items, ...newSponsorships];

      return {
        ...state,
        sponsorships: {
          items,
          currentPage,
          lastPage,
          total
        }
      };
    }
    default:
      return state;
  }
};

export default sponsorFormsListReducer;
