/**
 * Copyright 2018 OpenStack Foundation
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

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  RECEIVE_TICKET_TYPE,
  RESET_TICKET_TYPE_FORM,
  UPDATE_TICKET_TYPE,
  TICKET_TYPE_UPDATED,
  TICKET_TYPE_ADDED
} from "../../actions/ticket-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  external_id: 0,
  badge_type_id: 0,
  description: "",
  cost: 0,
  currency: null,
  quantity_2_sell: 0,
  max_quantity_per_order: 0,
  sales_start_date: "",
  sales_end_date: "",
  audience: "All",
  allows_to_delegate: false,
  allows_to_reassign: true
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const ticketTypeReducer = (state = DEFAULT_STATE, action = {}) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (payload?.persistStore) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case SET_CURRENT_SUMMIT:
    case RESET_TICKET_TYPE_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case UPDATE_TICKET_TYPE: {
      return { ...state, entity: { ...payload }, errors: {} };
    }
    case TICKET_TYPE_ADDED:
    case RECEIVE_TICKET_TYPE: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity[key]) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return { ...state, entity: { ...DEFAULT_ENTITY, ...entity } };
    }
    case TICKET_TYPE_UPDATED: {
      return state;
    }
    case VALIDATE: {
      return { ...state, errors: payload.errors };
    }
    default:
      return state;
  }
};

export default ticketTypeReducer;
