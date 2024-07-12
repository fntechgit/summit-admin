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
 **/

import {
  RECEIVE_TAG,
  RESET_TAG_FORM,
  UPDATE_TAG,
  TAG_UPDATED,
  TAG_ADDED
} from "../../actions/tag-actions";

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";

export const DEFAULT_ENTITY = {
  id: 0,
  tag: "",
  created: "",
  updated: ""
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const tagReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      {
        // we need this in ce the token expired while editing the form
        if (payload.hasOwnProperty("persistStore")) {
          return state;
        } else {
          return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
        }
      }
      break;
    case RESET_TAG_FORM:
      {
        return DEFAULT_STATE;
      }
      break;
    case UPDATE_TAG:
      {
        return { ...state, entity: { ...payload }, errors: {} };
      }
      break;
    case TAG_ADDED:
    case RECEIVE_TAG:
      {
        let entity = { ...payload.response };

        for (var key in entity) {
          if (entity.hasOwnProperty(key)) {
            entity[key] = entity[key] == null ? "" : entity[key];
          }
        }

        return {
          ...state,
          entity: { ...DEFAULT_ENTITY, ...entity },
          errors: {}
        };
      }
      break;
    case TAG_UPDATED:
      {
        return state;
      }
      break;
    case VALIDATE:
      {
        return { ...state, errors: payload.errors };
      }
      break;
    default:
      return state;
  }
};

export default tagReducer;
