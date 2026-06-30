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
  RECEIVE_ADD_ON_TYPE,
  RESET_ADD_ON_TYPE_FORM
} from "../../actions/add-on-types-actions";

export const DEFAULT_ENTITY = {
  id: 0,
  name: "",
  created: null,
  last_edited: null
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY
};

const addOnTypeReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload = {} } = action;
  switch (type) {
    case LOGOUT_USER: {
      // we need this in case the token expired while editing the form
      if (Object.prototype.hasOwnProperty.call(payload, "persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY } };
    }
    case RESET_ADD_ON_TYPE_FORM: {
      return { ...state, entity: { ...DEFAULT_ENTITY } };
    }
    case RECEIVE_ADD_ON_TYPE: {
      const entity = { ...payload.response };

      return {
        ...state,
        entity: {
          ...DEFAULT_ENTITY,
          ...entity
        }
      };
    }
    default:
      return state;
  }
};

export default addOnTypeReducer;
