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
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import {
  REQUEST_SPONSOR_MANAGED_FORMS,
  RECEIVE_SPONSOR_MANAGED_FORMS
} from "../../actions/sponsor-forms-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  sponsorManagedForms: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalCount: 0,
  summitTZ: ""
};

const sponsorManagedFormsListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_MANAGED_FORMS: {
      const { order, orderDir, page, term, summitTZ } = payload;

      return {
        ...state,
        order,
        orderDir,
        sponsorManagedForms: [],
        currentPage: page,
        term,
        summitTZ
      };
    }
    case RECEIVE_SPONSOR_MANAGED_FORMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const sponsorManagedForms = payload.response.data.map((a) => {
        const opens_at = a.opens_at
          ? epochToMomentTimeZone(a.opens_at, state.summitTZ)?.format(
              "YYYY/MM/DD"
            )
          : "N/A";
        const expires_at = a.expires_at
          ? epochToMomentTimeZone(a.expires_at, state.summitTZ)?.format(
              "YYYY/MM/DD"
            )
          : "N/A";

        return {
          id: a.id,
          code: a.code,
          name: a.name,
          items_count: a.items_count,
          add_ons: a.add_ons,
          is_archived: a.is_archived,
          opens_at,
          expires_at
        };
      });

      return {
        ...state,
        sponsorManagedForms,
        currentPage,
        totalCount: total,
        lastPage
      };
    }
    default:
      return state;
  }
};

export default sponsorManagedFormsListReducer;
