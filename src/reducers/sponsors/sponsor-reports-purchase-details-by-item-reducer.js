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
import { DEFAULT_CURRENT_PAGE, DEFAULT_PER_PAGE } from "../../utils/constants";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  REQUEST_PURCHASE_DETAILS_BY_ITEM,
  RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS,
  PURCHASE_DETAILS_BY_ITEM_READ_ERROR,
  SET_PURCHASE_DETAILS_BY_ITEM_PAGING
} from "../../actions/sponsor-reports-actions";

export const DEFAULT_STATE = {
  data: [], // ALL filtered line rows (whole-set fetch; client-side rollup)
  summary: null,
  // Client-side paging over the DERIVED sponsor groups — no server page exists.
  // Recorded via SET_PURCHASE_DETAILS_BY_ITEM_PAGING (not REQUEST) so the user's
  // place survives the Orders ↔ By Item toggle and SPA navigation; filters are
  // recorded on REQUEST like the sibling slices.
  currentPage: DEFAULT_CURRENT_PAGE,
  perPage: DEFAULT_PER_PAGE,
  filters: {},
  readError: null
};

const reducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
    case SET_CURRENT_SUMMIT:
      return DEFAULT_STATE;
    case REQUEST_PURCHASE_DETAILS_BY_ITEM: {
      const { filters } = payload;
      return { ...state, filters, readError: null };
    }
    case RECEIVE_PURCHASE_DETAILS_BY_ITEM_ROWS: {
      const env = payload.response;
      return {
        ...state,
        data: env.data,
        summary: env.summary ?? null,
        readError: null
      };
    }
    case SET_PURCHASE_DETAILS_BY_ITEM_PAGING: {
      const { currentPage, perPage } = payload;
      return { ...state, currentPage, perPage };
    }
    case PURCHASE_DETAILS_BY_ITEM_READ_ERROR:
      return { ...state, readError: payload };
    default:
      return state;
  }
};

export default reducer;
