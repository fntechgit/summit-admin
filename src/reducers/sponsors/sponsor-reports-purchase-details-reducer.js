/**
 * Copyright 2017 OpenStack Foundation
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
  REQUEST_PURCHASE_DETAILS,
  RECEIVE_PURCHASE_DETAILS,
  RECEIVE_PURCHASE_DETAILS_FILTERS,
  PURCHASE_DETAILS_READ_ERROR,
  PURCHASE_DETAILS_VALIDATION_ERROR,
  PURCHASE_DETAILS_VALIDATION_CLEAR
} from "../../actions/sponsor-reports-actions";

export const DEFAULT_STATE = {
  data: [],
  summary: null,
  filterOptions: null,
  total: 0,
  // Pagination/sort/filter live here (recorded on REQUEST) so they survive SPA
  // navigation; the global overlay owns loading (state.baseState.loading).
  currentPage: DEFAULT_CURRENT_PAGE,
  lastPage: DEFAULT_CURRENT_PAGE,
  perPage: DEFAULT_PER_PAGE,
  order: null,
  orderDir: null,
  filters: {},
  readError: null, // replaces the body (read-disabled / not-found / unauthorized / unknown)
  validationError: null // 412 — inline/toast, body stays
};

const reducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
    case SET_CURRENT_SUMMIT:
      return DEFAULT_STATE;
    case REQUEST_PURCHASE_DETAILS: {
      const { currentPage, perPage, order, orderDir, filters } = payload;
      return {
        ...state,
        currentPage,
        perPage,
        order,
        orderDir,
        filters,
        readError: null
      };
    }
    case RECEIVE_PURCHASE_DETAILS: {
      const {
        data,
        total,
        last_page: lastPage,
        per_page: perPage,
        current_page: currentPage,
        summary
      } = payload.response;
      return {
        ...state,
        data,
        total,
        lastPage,
        perPage,
        currentPage,
        summary: summary ?? state.summary,
        readError: null,
        validationError: null
      };
    }
    case RECEIVE_PURCHASE_DETAILS_FILTERS:
      return { ...state, filterOptions: payload.response };
    case PURCHASE_DETAILS_READ_ERROR:
      return { ...state, readError: payload };
    case PURCHASE_DETAILS_VALIDATION_ERROR:
      // Do NOT replace the body — surface inline/toast; keep the last good rows.
      return { ...state, validationError: payload };
    case PURCHASE_DETAILS_VALIDATION_CLEAR:
      return { ...state, validationError: null };
    default:
      return state;
  }
};

export default reducer;
