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
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  REQUEST_UNPAID_CHARGES,
  RECEIVE_UNPAID_CHARGES,
  UNPAID_CHARGES_READ_ERROR
} from "../../actions/sponsor-reports-actions";
import { DEFAULT_CURRENT_PAGE, DEFAULT_PER_PAGE } from "../../utils/constants";

export const DEFAULT_STATE = {
  rows: [],
  term: "",
  order: "sponsor_name",
  orderDir: 1,
  currentPage: DEFAULT_CURRENT_PAGE,
  lastPage: DEFAULT_CURRENT_PAGE,
  perPage: DEFAULT_PER_PAGE,
  totalCount: 0,
  totalAmount: 0,
  pricingErrorCount: 0,
  filters: { adminOnly: true },
  readError: null
};

const reducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
    case SET_CURRENT_SUMMIT:
      return DEFAULT_STATE;
    case REQUEST_UNPAID_CHARGES: {
      const { term, page, perPage, order, orderDir, filters } = payload;
      return {
        ...state,
        term,
        currentPage: page,
        perPage,
        order,
        orderDir,
        filters,
        // A late response from a prior summit must not survive into the next fetch.
        rows: [],
        totalCount: 0,
        totalAmount: 0,
        pricingErrorCount: 0,
        readError: null
      };
    }
    case RECEIVE_UNPAID_CHARGES: {
      const {
        data,
        total,
        current_page: currentPage,
        last_page: lastPage,
        total_amount: totalAmount,
        pricing_error_count: pricingErrorCount
      } = payload.response;
      return {
        ...state,
        rows: data,
        totalCount: total,
        currentPage,
        lastPage,
        totalAmount,
        pricingErrorCount
      };
    }
    case UNPAID_CHARGES_READ_ERROR:
      // Never leave the previous balances on screen after a failed read.
      return {
        ...state,
        readError: payload,
        rows: [],
        totalCount: 0,
        totalAmount: 0,
        pricingErrorCount: 0
      };
    default:
      return state;
  }
};

export default reducer;
