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

import { VALIDATE } from "openstack-uicore-foundation/lib/utils/actions";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

import {
  EVENT_RSVP_UPDATED,
  RECEIVE_EVENT_RSVP
} from "../../actions/event-rsvp-actions";

export const DEFAULT_ENTITY = {
  id: 0
};

const DEFAULT_STATE = {
  entity: DEFAULT_ENTITY,
  errors: {}
};

const eventRSVPReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER:
      // we need this in case the token expired while editing the form
      if (payload.hasOwnProperty("persistStore")) {
        return state;
      }
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case SET_CURRENT_SUMMIT:
      return { ...state, entity: { ...DEFAULT_ENTITY }, errors: {} };
    case EVENT_RSVP_UPDATED:
    case RECEIVE_EVENT_RSVP: {
      const entity = { ...payload.response };

      entity.attendee_full_name = `${entity.owner?.first_name} ${entity.owner?.last_name}`;

      return { ...state, entity, errors: {} };
    }
    case VALIDATE:
      return { ...state, errors: payload.errors };
    default:
      return state;
  }
};

export default eventRSVPReducer;
