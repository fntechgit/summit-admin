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
  UNPAID_CHARGES_READ_ERROR,
  SET_UNPAID_CHARGES_PAGING,
  SET_UNPAID_CHARGES_SORT
} from "../../actions/sponsor-reports-actions";
import { DEFAULT_CURRENT_PAGE, DEFAULT_PER_PAGE } from "../../utils/constants";

export const DEFAULT_STATE = {
  rows: [],
  term: "",
  filters: { adminOnly: true, stage: "" },
  sort: "balance",
  currentPage: DEFAULT_CURRENT_PAGE,
  perPage: DEFAULT_PER_PAGE,
  readError: null
};

const reducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
    case SET_CURRENT_SUMMIT:
      return DEFAULT_STATE;
    case REQUEST_UNPAID_CHARGES: {
      const { term, filters } = payload;
      return {
        ...state,
        term,
        filters,
        // A late response from a prior summit must not survive into the next fetch.
        rows: [],
        currentPage: DEFAULT_CURRENT_PAGE,
        readError: null
      };
    }
    case RECEIVE_UNPAID_CHARGES:
      return { ...state, rows: payload.response.data, readError: null };
    case UNPAID_CHARGES_READ_ERROR:
      // Never leave the previous balances on screen after a failed read.
      return { ...state, readError: payload, rows: [] };
    case SET_UNPAID_CHARGES_PAGING: {
      const { currentPage, perPage } = payload;
      return { ...state, currentPage, perPage };
    }
    case SET_UNPAID_CHARGES_SORT:
      return {
        ...state,
        sort: payload.sort,
        currentPage: DEFAULT_CURRENT_PAGE
      };
    default:
      return state;
  }
};

export default reducer;
