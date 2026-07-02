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
  REQUEST_SPONSOR_DRILLDOWN,
  RECEIVE_SPONSOR_DRILLDOWN,
  SPONSOR_DRILLDOWN_READ_ERROR
} from "../../actions/sponsor-reports-actions";

export const DEFAULT_STATE = {
  // The whole retrieve response: { sponsor: {id,name,tier,pages_active}, pages: [...] }.
  // Single-sponsor fetch by id — no pagination/sort/filter state to relocate; the
  // global overlay owns loading (state.baseState.loading).
  detail: null,
  readError: null // includes { kind: "not-found" } for unknown sponsor (404)
};

const reducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
    case SET_CURRENT_SUMMIT:
      return DEFAULT_STATE;
    case REQUEST_SPONSOR_DRILLDOWN:
      return { ...state, readError: null, detail: null };
    case RECEIVE_SPONSOR_DRILLDOWN:
      return {
        ...state,
        detail: payload.response,
        readError: null
      };
    case SPONSOR_DRILLDOWN_READ_ERROR:
      return { ...state, readError: payload };
    default:
      return state;
  }
};

export default reducer;
