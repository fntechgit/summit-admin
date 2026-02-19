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
  RECEIVE_SHOW_PAGE,
  RECEIVE_SHOW_PAGES,
  REQUEST_SHOW_PAGES,
  SHOW_PAGE_ARCHIVED,
  SHOW_PAGE_UNARCHIVED,
  SHOW_PAGE_DELETED,
  RESET_SHOW_PAGE_FORM
} from "../../actions/show-pages-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { PAGES_MODULE_KINDS } from "../../utils/constants";

const DEFAULT_SHOW_PAGE = {
  code: "",
  name: "",
  modules: []
};

export const DEFAULT_STATE = {
  showPages: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  hideArchived: false,
  currentShowPage: DEFAULT_SHOW_PAGE,
  summitTZ: null
};

const showPagesListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SHOW_PAGES: {
      const { order, orderDir, page, term, hideArchived, summitTZ } = payload;

      return {
        ...state,
        order,
        orderDir,
        showPages: [],
        currentPage: page,
        term,
        hideArchived,
        summitTZ
      };
    }
    case RECEIVE_SHOW_PAGES: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const showPages = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        tier: a.sponsorship_types.map((s) => s.name).join(", "),
        info_mod: a.modules.filter((m) => m.kind === PAGES_MODULE_KINDS.INFO)
          .length,
        upload_mod: a.modules.filter((m) => m.kind === PAGES_MODULE_KINDS.MEDIA)
          .length,
        download_mod: a.modules.filter(
          (m) => m.kind === PAGES_MODULE_KINDS.DOCUMENT
        ).length,
        is_archived: a.is_archived
      }));

      return {
        ...state,
        showPages,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    case SHOW_PAGE_ARCHIVED: {
      const { pageId } = payload;
      const pages = state.showPages.map((page) =>
        page.id === pageId ? { ...page, is_archived: true } : page
      );
      return {
        ...state,
        showPages: [...pages]
      };
    }
    case SHOW_PAGE_UNARCHIVED: {
      const { pageId } = payload;
      const pages = state.showPages.map((page) =>
        page.id === pageId ? { ...page, is_archived: false } : page
      );
      return {
        ...state,
        showPages: [...pages]
      };
    }
    case RECEIVE_SHOW_PAGE: {
      const showPage = payload.response;

      return { ...state, currentShowPage: showPage };
    }
    case SHOW_PAGE_DELETED: {
      const { pageId } = payload;
      const showPages = state.showPages.filter((it) => it.id !== pageId);

      return { ...state, showPages, totalCount: state.totalCount - 1 };
    }
    case RESET_SHOW_PAGE_FORM: {
      return { ...state, currentShowPage: DEFAULT_SHOW_PAGE };
    }
    default:
      return state;
  }
};

export default showPagesListReducer;
