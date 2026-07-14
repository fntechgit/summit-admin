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
import {
  ADD_ON_TYPE_DELETED,
  RECEIVE_ADD_ON_TYPES,
  REQUEST_ADD_ON_TYPES
} from "../../actions/add-on-types-actions";

const DEFAULT_STATE = {
  addOnTypes: [],
  term: "",
  order: "name",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalAddOnTypes: 0
};

const addOnTypesListReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_ADD_ON_TYPES: {
      const { order, orderDir, term, page, perPage } = payload;
      return { ...state, order, orderDir, term, currentPage: page, perPage };
    }
    case RECEIVE_ADD_ON_TYPES: {
      const { current_page, total, last_page, data } = payload.response;

      return {
        ...state,
        addOnTypes: data,
        currentPage: current_page,
        totalAddOnTypes: total,
        lastPage: last_page
      };
    }
    case ADD_ON_TYPE_DELETED: {
      const { addOnTypeId } = payload;
      return {
        ...state,
        addOnTypes: state.addOnTypes.filter((a) => a.id !== addOnTypeId)
      };
    }
    default:
      return state;
  }
};

export default addOnTypesListReducer;
