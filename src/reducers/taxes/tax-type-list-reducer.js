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
  RECEIVE_TAX_TYPES,
  REQUEST_TAX_TYPES,
  TAX_TYPE_DELETED
} from "../../actions/tax-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  taxTypes: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalTaxTypes: 0
};

const taxTypeListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_TAX_TYPES: {
      const { order, orderDir, page, ...rest } = payload;

      return {
        ...state,
        order,
        orderDir,
        currentPage: page,
        ...rest
      };
    }
    case RECEIVE_TAX_TYPES: {
      const { total, current_page, last_page } = payload.response;
      const taxTypes = payload.response.data;

      return {
        ...state,
        taxTypes,
        totalTaxTypes: total,
        currentPage: current_page,
        lastPage: last_page
      };
    }
    case TAX_TYPE_DELETED: {
      const { taxTypeId } = payload;
      return {
        ...state,
        taxTypes: state.taxTypes.filter((t) => t.id !== taxTypeId)
      };
    }
    default:
      return state;
  }
};

export default taxTypeListReducer;
