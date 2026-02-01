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
  RECEIVE_SPONSOR_PAGE,
  RECEIVE_SPONSOR_PAGES,
  REQUEST_SPONSOR_PAGES,
  SPONSOR_PAGE_ARCHIVED,
  SPONSOR_PAGE_UNARCHIVED
} from "../../actions/sponsor-pages-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { PAGES_MODULE_KINDS } from "../../utils/constants";

const DEFAULT_STATE = {
  sponsorPages: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  hideArchived: false,
  currentSponsorPage: null,
  summitTZ: null
};

const sponsorPagesListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_PAGES: {
      const { order, orderDir, page, term, hideArchived, summitTZ } = payload;

      return {
        ...state,
        order,
        orderDir,
        sponsorPages: [],
        currentPage: page,
        term,
        hideArchived,
        summitTZ
      };
    }
    case RECEIVE_SPONSOR_PAGES: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const sponsorPages = payload.response.data.map((a) => ({
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
        sponsorPages,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    case SPONSOR_PAGE_ARCHIVED: {
      const { pageId } = payload;
      const pages = state.sponsorPages.map((page) =>
        page.id === pageId ? { ...page, is_archived: true } : page
      );
      return {
        ...state,
        sponsorPages: [...pages]
      };
    }
    case SPONSOR_PAGE_UNARCHIVED: {
      const { pageId } = payload;
      const pages = state.sponsorPages.map((page) =>
        page.id === pageId ? { ...page, is_archived: false } : page
      );
      return {
        ...state,
        sponsorPages: [...pages]
      };
    }
    case RECEIVE_SPONSOR_PAGE: {
      const sponsorPage = payload.response;

      return { ...state, currentSponsorPage: sponsorPage };
    }
    default:
      return state;
  }
};

export default sponsorPagesListReducer;
