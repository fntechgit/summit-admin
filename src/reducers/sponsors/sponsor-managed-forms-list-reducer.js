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
  totalCount: 0
};

const sponsorManagedFormsListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_SPONSOR_MANAGED_FORMS: {
      const { order, orderDir, page, term } = payload;

      return {
        ...state,
        order,
        orderDir,
        sponsorForms: [],
        currentPage: page,
        term
      };
    }
    case RECEIVE_SPONSOR_MANAGED_FORMS: {
      const {
        current_page: currentPage,
        total,
        last_page: lastPage
      } = payload.response;

      const sponsorForms = payload.response.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        items_qty: `${a.items.length} ${
          a.items.length === 1 ? "Item" : "Items"
        }`,
        is_archived: a.is_archived
      }));

      return {
        ...state,
        sponsorForms,
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
