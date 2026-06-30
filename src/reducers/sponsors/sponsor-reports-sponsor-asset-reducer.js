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
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import {
  REQUEST_SPONSOR_ASSET,
  RECEIVE_SPONSOR_ASSET_FILTERS,
  RECEIVE_SPONSOR_ASSET_ROWS,
  SPONSOR_ASSET_READ_ERROR
} from "../../actions/sponsor-reports-actions";

export const DEFAULT_STATE = {
  filterOptions: null, // { sponsors, pages, tiers, components }
  rows: [], // flat collected-asset rows for client-side pivot
  summary: null, // { total, by_status, by_page }
  loading: true, // true by default — the page always fetches on mount; avoids a no-results flash before first fetch
  readError: null
};

const reducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
    case SET_CURRENT_SUMMIT:
      return DEFAULT_STATE;
    case REQUEST_SPONSOR_ASSET:
      return { ...state, loading: true, readError: null };
    case RECEIVE_SPONSOR_ASSET_FILTERS:
      // loading is report-owned now (filters use a null request action), so leave it alone.
      return { ...state, filterOptions: payload.response, readError: null };
    case RECEIVE_SPONSOR_ASSET_ROWS: {
      const env = payload.response;
      return {
        ...state,
        rows: env.data,
        summary: env.summary,
        loading: false,
        readError: null
      };
    }
    case SPONSOR_ASSET_READ_ERROR:
      return { ...state, loading: false, readError: payload };
    default:
      return state;
  }
};

export default reducer;
