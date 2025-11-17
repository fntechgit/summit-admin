/**
 * Copyright 2020 OpenStack Foundation
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
  RECEIVE_PAYMENT_FEE_TYPE,
  RESET_PAYMENT_PROFILE_FORM,
  PAYMENT_PROFILE_UPDATED,
  RESET_PAYMENT_FEE_TYPE_FORM
} from "../../actions/ticket-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  kind: null,
  payment_method: null,
  value: null,
  min_cents: null,
  max_cents: null
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const paymentFeeTypeReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case SET_CURRENT_SUMMIT:
    case RESET_PAYMENT_PROFILE_FORM:
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case RECEIVE_PAYMENT_FEE_TYPE: {
      const entity = { ...payload.response };

      for (const key in entity) {
        if (entity.hasOwnProperty(key)) {
          entity[key] = entity[key] == null ? "" : entity[key];
        }
      }

      return { ...state, entity: { ...DEFAULT_ENTITY, ...entity } };
    }
    case PAYMENT_PROFILE_UPDATED:
      return state;
    case RESET_PAYMENT_FEE_TYPE_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    }
    case VALIDATE:
      return { ...state, errors: payload.errors };
    default:
      return state;
  }
};

export default paymentFeeTypeReducer;
