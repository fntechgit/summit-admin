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
  REQUEST_SPONSOR_MANAGED_PAGES,
  RECEIVE_SPONSOR_MANAGED_PAGES,
  RECEIVE_SPONSOR_CUSTOMIZED_PAGES,
  REQUEST_SPONSOR_CUSTOMIZED_PAGES,
  RECEIVE_SPONSOR_CUSTOMIZED_PAGE,
  RESET_EDIT_PAGE
} from "../../actions/sponsor-pages-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { RECEIVE_GLOBAL_SPONSORSHIPS } from "../../actions/sponsor-forms-actions";
import { PAGES_MODULE_KINDS } from "../../utils/constants";

const DEFAULT_PAGE = {
  code: "",
  name: "",
  allowed_add_ons: [],
  modules: []
};

const DEFAULT_STATE = {
  managedPages: {
    pages: [],
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalItems: 0
  },
  customizedPages: {
    pages: [],
    order: "name",
    orderDir: 1,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    totalItems: 0
  },
  currentEditPage: DEFAULT_PAGE,
  sponsorships: {
    items: [],
    currentPage: 0,
    lastPage: 0,
    total: 0
  },
  term: "",
  hideArchived: false,
  summitTZ: ""
};

const sponsorPagePagesListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_MANAGED_PAGES: {
      const { order, orderDir, page, perPage, term, summitTZ, hideArchived } =
        payload;

      return {
        ...state,
        managedPages: {
          ...state.managedPages,
          order,
          orderDir,
          pages: [],
          currentPage: page,
          perPage
        },
        term,
        summitTZ,
        hideArchived
      };
    }
    case REQUEST_SPONSOR_CUSTOMIZED_PAGES: {
      const { order, orderDir, page, perPage, term, summitTZ, hideArchived } =
        payload;

      return {
        ...state,
        customizedPages: {
          ...state.customizedPages,
          order,
          orderDir,
          pages: [],
          currentPage: page,
          perPage
        },
        term,
        summitTZ,
        hideArchived
      };
    }
    case RECEIVE_SPONSOR_MANAGED_PAGES: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const pages = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        allowed_add_ons: a.allowed_add_ons,
        info_mod: a.modules_count.info_modules_count,
        upload_mod: a.modules_count.media_request_modules_count,
        download_mod: a.modules_count.document_download_modules_count
      }));

      return {
        ...state,
        managedPages: {
          ...state.managedPages,
          pages,
          currentPage,
          totalItems: total,
          lastPage
        }
      };
    }
    case RECEIVE_SPONSOR_CUSTOMIZED_PAGES: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const pages = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        allowed_add_ons: a.allowed_add_ons,
        is_archived: a.is_archived,
        info_mod: a.modules.filter((m) => m.kind === PAGES_MODULE_KINDS.INFO)
          .length,
        upload_mod: a.modules.filter((m) => m.kind === PAGES_MODULE_KINDS.MEDIA)
          .length,
        download_mod: a.modules.filter(
          (m) => m.kind === PAGES_MODULE_KINDS.DOCUMENT
        ).length
      }));

      return {
        ...state,
        customizedPages: {
          ...state.customizedPages,
          pages,
          currentPage,
          totalItems: total,
          lastPage
        }
      };
    }
    case RECEIVE_SPONSOR_CUSTOMIZED_PAGE: {
      const customizedPage = payload.response;
      return { ...state, currentEditPage: customizedPage };
    }
    case RESET_EDIT_PAGE: {
      return { ...state, currentEditPage: DEFAULT_PAGE };
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

export default sponsorPagePagesListReducer;
