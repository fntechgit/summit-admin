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

import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";

import {
  RECEIVE_EVENT_RSVP,
  REQUEST_EVENT_RSVP
} from "../../actions/event-rsvp-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

const DEFAULT_STATE = {
  eventRsvp: [],
  term: "",
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalEventRsvp: 0
};

const eventRSVPListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EVENT_RSVP: {
      const { order, orderDir, term } = payload;

      return { ...state, order, orderDir, term };
    }
    case RECEIVE_EVENT_RSVP: {
      const { current_page, total, last_page, data } = payload.response;

      const eventRsvp = data.map((r) => ({
        attendee_full_name: `${r.owner?.first_name} ${r.owner?.last_name}`,
        ...r
      }));

      return {
        ...state,
        eventRsvp,
        currentPage: current_page,
        totalRsvpTemplates: total,
        lastPage: last_page
      };
    }
    default:
      return state;
  }
};

export default eventRSVPListReducer;
