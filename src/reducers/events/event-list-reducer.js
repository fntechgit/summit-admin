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

import moment from "moment-timezone";
import momentDurationFormatSetup from "moment-duration-format";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";

import {
  RECEIVE_EVENTS,
  REQUEST_EVENTS,
  EVENT_DELETED,
  CHANGE_SEARCH_TERM
} from "../../actions/event-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";

momentDurationFormatSetup(moment);

const DEFAULT_STATE = {
  events: {},
  term: null,
  order: "id",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalEvents: 0,
  summitTZ: "",
  filters: {},
  extraColumns: [],
  selectionPlans: []
};

// eslint-disable-next-line default-param-last
const eventListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EVENTS: {
      const {
        order,
        orderDir,
        term,
        summitTZ,
        filters,
        extraColumns,
        selectionPlans
      } = payload;

      const selection_plans = selectionPlans.map((sp) => ({
        label: sp.name,
        value: sp.id
      }));

      return {
        ...state,
        order,
        orderDir,
        term,
        summitTZ,
        filters,
        extraColumns,
        selectionPlans: selection_plans
      };
    }
    case RECEIVE_EVENTS: {
      const { data, current_page, total, last_page } = payload.response;

      const events = data.map((e) => ({
        ...e,
        selection_plan: e.selection_plan
          ? state.selectionPlans.find(
              (sp) => sp.label === e.selection_plan.name
            )
          : null
      }));

      return {
        ...state,
        events,
        currentPage: current_page,
        totalEvents: total,
        lastPage: last_page
      };
    }
    case EVENT_DELETED: {
      const { eventId } = payload;
      return { ...state, events: state.events.filter((e) => e.id !== eventId) };
    }
    case CHANGE_SEARCH_TERM: {
      const { term } = payload;
      return { ...state, term };
    }
    default:
      return state;
  }
};

export default eventListReducer;
