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
import { DEFAULT_PER_PAGE } from "../../utils/constants";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  REQUEST_PURCHASE_DETAILS_LINES,
  RECEIVE_PURCHASE_DETAILS_LINES,
  PURCHASE_DETAILS_LINES_READ_ERROR
} from "../../actions/sponsor-reports-actions";

export const DEFAULT_STATE = {
  data: [],
  summary: null,
  total: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: DEFAULT_PER_PAGE,
  loading: false,
  readError: null
};

const reducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
    case SET_CURRENT_SUMMIT:
      return DEFAULT_STATE;
    case REQUEST_PURCHASE_DETAILS_LINES:
      return { ...state, loading: true, readError: null };
    case RECEIVE_PURCHASE_DETAILS_LINES: {
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
        loading: false,
        readError: null
      };
    }
    case PURCHASE_DETAILS_LINES_READ_ERROR:
      return { ...state, loading: false, readError: payload };
    default:
      return state;
  }
};

export default reducer;
