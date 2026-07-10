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
  REQUEST_PAGE_TEMPLATES,
  RECEIVE_PAGE_TEMPLATES,
  PAGE_TEMPLATE_DELETED,
  PAGE_TEMPLATE_ARCHIVED,
  PAGE_TEMPLATE_UNARCHIVED
} from "../../actions/page-template-actions";
import { PAGES_MODULE_KINDS } from "../../utils/constants";
import { getSafePageAfterRemove } from "../../utils/methods";

const DEFAULT_STATE = {
  pageTemplates: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalPageTemplates: 0,
  showArchived: false
};

const pageTemplateListReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_PAGE_TEMPLATES: {
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
        pageTemplates: [],
        currentPage: page,
        perPage,
        ...rest
      };
    }
    case RECEIVE_PAGE_TEMPLATES: {
      const { current_page, total, last_page } = payload.response;

      const pageTemplates = payload.response.data.map((a) => {
        const modules = a.modules ?? [];
        return {
          id: a.id,
          code: a.code,
          name: a.name,
          info_mod: modules.filter((m) => m.kind === PAGES_MODULE_KINDS.INFO)
            .length,
          upload_mod: modules.filter((m) => m.kind === PAGES_MODULE_KINDS.MEDIA)
            .length,
          download_mod: modules.filter(
            (m) => m.kind === PAGES_MODULE_KINDS.DOCUMENT
          ).length,
          is_archived: a.is_archived
        };
      });

      return {
        ...state,
        pageTemplates,
        currentPage: current_page,
        totalPageTemplates: total,
        lastPage: last_page
      };
    }
    case PAGE_TEMPLATE_DELETED: {
      const { pageTemplateId } = payload;
      const { totalPageTemplates, perPage, currentPage } = state;
      return {
        ...state,
        pageTemplates: state.pageTemplates.filter(
          (a) => a.id !== pageTemplateId
        ),
        currentPage: getSafePageAfterRemove(
          totalPageTemplates,
          perPage,
          currentPage
        )
      };
    }
    case PAGE_TEMPLATE_ARCHIVED: {
      const updatedFormTemplate = payload.response;
      const { totalPageTemplates, perPage, currentPage } = state;
      const updatedPageTemplates = state.pageTemplates.map((item) =>
        item.id === updatedFormTemplate.id
          ? { ...item, is_archived: true }
          : item
      );
      return {
        ...state,
        pageTemplates: updatedPageTemplates,
        currentPage: getSafePageAfterRemove(
          totalPageTemplates,
          perPage,
          currentPage
        )
      };
    }
    case PAGE_TEMPLATE_UNARCHIVED: {
      const { pageTemplateId } = payload;
      const { totalPageTemplates, perPage, currentPage } = state;
      const updatedPageTemplates = state.pageTemplates.map((item) =>
        item.id === pageTemplateId ? { ...item, is_archived: false } : item
      );
      return {
        ...state,
        pageTemplates: updatedPageTemplates,
        currentPage: getSafePageAfterRemove(
          totalPageTemplates,
          perPage,
          currentPage
        )
      };
    }
    default:
      return state;
  }
};

export default pageTemplateListReducer;
