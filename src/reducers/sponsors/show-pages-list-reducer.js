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
import T from "i18n-react/dist/i18n-react";

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
import { RECEIVE_GLOBAL_SPONSORSHIPS } from "../../actions/sponsor-forms-actions";

const DEFAULT_SHOW_PAGE = {
  code: "",
  name: "",
  sponsorship_types: [],
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
  sponsorships: {
    items: [],
    currentPage: 0,
    lastPage: 0,
    total: 0
  },
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
      const { order, orderDir, page, perPage, term, hideArchived, summitTZ } =
        payload;

      return {
        ...state,
        order,
        orderDir,
        showPages: [],
        currentPage: page,
        perPage,
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
        tier: a.apply_to_all_types
          ? T.translate("show_pages.all_tiers")
          : a.sponsorship_types.map((s) => s.name).join(", "),
        info_mod: a.modules_count.info_modules_count,
        upload_mod: a.modules_count.media_request_modules_count,
        download_mod: a.modules_count.document_download_modules_count,
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

      const sponsorshipTypeIds = showPage.apply_to_all_types
        ? ["all"]
        : [...showPage.sponsorship_types];

      return {
        ...state,
        currentShowPage: { ...showPage, sponsorship_types: sponsorshipTypeIds }
      };
    }
    case SHOW_PAGE_DELETED: {
      const { pageId } = payload;
      const showPages = state.showPages.filter((it) => it.id !== pageId);

      return { ...state, showPages, totalCount: state.totalCount - 1 };
    }
    case RESET_SHOW_PAGE_FORM: {
      return { ...state, currentShowPage: DEFAULT_SHOW_PAGE };
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

export default showPagesListReducer;
