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
import {
  RECEIVE_EVENT_TYPES,
  REQUEST_EVENT_TYPES,
  EVENT_TYPE_DELETED,
  EVENT_TYPES_SEEDED
} from "../../actions/event-type-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  eventTypes: [],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalEventTypes: 0
};

const eventTypeListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EVENT_TYPES: {
      const { order, orderDir, term, perPage } = payload;
      return { ...state, order, orderDir, term, perPage };
    }
    case RECEIVE_EVENT_TYPES: {
      const { total, last_page, current_page } = payload.response;
      const eventTypes = [...payload.response.data];

      return {
        ...state,
        eventTypes,
        currentPage: current_page,
        lastPage: last_page,
        totalEventTypes: total
      };
    }
    case EVENT_TYPE_DELETED: {
      const { eventTypeId } = payload;
      return {
        ...state,
        eventTypes: state.eventTypes.filter((e) => e.id !== eventTypeId)
      };
    }
    case EVENT_TYPES_SEEDED: {
      const eventTypesAdded = payload.response.data;
      if (eventTypesAdded.length > 0) {
        return {
          ...state,
          eventTypes: [...state.eventTypes, ...eventTypesAdded]
        };
      }
      return state;
    }
    default:
      return state;
  }
};

export default eventTypeListReducer;
