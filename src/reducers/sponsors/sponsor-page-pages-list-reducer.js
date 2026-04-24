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
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  REQUEST_SPONSOR_MANAGED_PAGES,
  RECEIVE_SPONSOR_MANAGED_PAGES,
  RECEIVE_SPONSOR_CUSTOMIZED_PAGES,
  REQUEST_SPONSOR_CUSTOMIZED_PAGES,
  RECEIVE_SPONSOR_CUSTOMIZED_PAGE,
  RESET_EDIT_PAGE,
  SPONSOR_CUSTOMIZED_PAGE_ARCHIVED,
  SPONSOR_CUSTOMIZED_PAGE_UNARCHIVED,
  RECEIVE_SPONSOR_MANAGED_PAGE
} from "../../actions/sponsor-pages-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { RECEIVE_GLOBAL_SPONSORSHIPS } from "../../actions/sponsor-forms-actions";
import {
  PAGE_MODULES_DOWNLOAD,
  PAGES_MODULE_KINDS
} from "../../utils/constants";

const DEFAULT_PAGE = {
  code: "",
  name: "",
  allowed_add_ons: [],
  modules: []
};

export const DEFAULT_STATE = {
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
  showArchived: false,
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
      const { order, orderDir, page, perPage, term, summitTZ, showArchived } =
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
        showArchived
      };
    }
    case REQUEST_SPONSOR_CUSTOMIZED_PAGES: {
      const { order, orderDir, page, perPage, term, summitTZ, showArchived } =
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
        showArchived
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
        download_mod: a.modules_count.document_download_modules_count,
        assigned_type: a.assigned_type
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
    case RECEIVE_SPONSOR_MANAGED_PAGE: {
      const editPage = payload.response;

      const currentEditPage = {
        ...editPage,
        modules: editPage.modules.map((m) => ({
          ...m,
          ...(m.upload_deadline
            ? {
                upload_deadline: epochToMomentTimeZone(
                  m.upload_deadline,
                  state.summitTZ || "UTC"
                )
              }
            : {})
        }))
      };
      return { ...state, currentEditPage };
    }
    case RECEIVE_SPONSOR_CUSTOMIZED_PAGE: {
      const customizedPage = payload.response;

      const modules = customizedPage.modules.map((module) => {
        const tmpModule = {
          ...module,
          ...(module.upload_deadline
            ? {
                upload_deadline: epochToMomentTimeZone(
                  module.upload_deadline,
                  state.summitTZ || "UTC"
                )
              }
            : {})
        };

        if (module.kind === PAGES_MODULE_KINDS.DOCUMENT) {
          if (module.file) {
            tmpModule.file = [
              {
                ...module.file,
                file_path: module.file.storage_key,
                public_url: module.file.file_url
              }
            ];
            tmpModule.type = PAGE_MODULES_DOWNLOAD.FILE;
          } else {
            tmpModule.type = PAGE_MODULES_DOWNLOAD.URL;
          }
        }
        return tmpModule;
      });

      return { ...state, currentEditPage: { ...customizedPage, modules } };
    }
    case SPONSOR_CUSTOMIZED_PAGE_ARCHIVED: {
      const { pageId } = payload;
      const pages = state.customizedPages.pages.map((page) =>
        page.id === pageId ? { ...page, is_archived: true } : page
      );
      return {
        ...state,
        customizedPages: {
          ...state.customizedPages,
          pages: [...pages]
        }
      };
    }
    case SPONSOR_CUSTOMIZED_PAGE_UNARCHIVED: {
      const { pageId } = payload;
      const pages = state.customizedPages.pages.map((page) =>
        page.id === pageId ? { ...page, is_archived: false } : page
      );
      return {
        ...state,
        customizedPages: {
          ...state.customizedPages,
          pages: [...pages]
        }
      };
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
