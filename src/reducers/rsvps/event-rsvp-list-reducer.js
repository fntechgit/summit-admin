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
  RECEIVE_EVENT_RSVPS,
  REQUEST_EVENT_RSVPS,
  EVENT_RSVP_ADDED,
  EVENT_RSVP_DELETED,
  SELECT_EVENT_RSVP,
  UNSELECT_EVENT_RSVP,
  CLEAR_ALL_SELECTED_EVENT_RSVP,
  SET_SELECTED_ALL_RSVP,
  RE_SEND_RSVP_CONFIRMATION
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
  totalEventRsvp: 0,
  selectedCount: 0,
  excludedRSVPIds: [],
  selectedRSVPIds: [],
  selectedAll: false
};

const eventRSVPListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EVENT_RSVPS: {
      const { order, orderDir, term } = payload;

      return { ...state, order, orderDir, term };
    }
    case RECEIVE_EVENT_RSVPS: {
      const { current_page, total, last_page, data } = payload.response;
      const { selectedAll, selectedRSVPIds, excludedRSVPIds } = state;

      const eventRsvp = data.map((r) => ({
        owner_full_name: `${r.owner?.first_name} ${r.owner?.last_name}`,
        checked: selectedAll
          ? !excludedRSVPIds.includes(r.id)
          : selectedRSVPIds.includes(r.id),
        ...r
      }));

      return {
        ...state,
        eventRsvp,
        currentPage: current_page,
        totalEventRsvp: total,
        lastPage: last_page
      };
    }
    case EVENT_RSVP_ADDED: {
      const newRSVP = {
        ...payload.response,
        owner_full_name: `${payload.response.owner?.first_name} ${payload.response.owner?.last_name}`
      };
      const updatedRSVP = [...state.eventRsvp, newRSVP];
      return {
        ...state,
        eventRsvp: updatedRSVP,
        totalEventRsvp: state.totalEventRsvp + 1
      };
    }
    case EVENT_RSVP_DELETED: {
      const { rsvpId } = payload;
      const updatedRSVP = state.eventRsvp.filter((e) => e.id !== rsvpId);
      return {
        ...state,
        eventRsvp: updatedRSVP,
        totalEventRsvp: state.totalEventRsvp - 1
      };
    }
    case RE_SEND_RSVP_CONFIRMATION:
    case CLEAR_ALL_SELECTED_EVENT_RSVP: {
      const eventRsvp = state.eventRsvp.map((i) => ({
        ...i,
        checked: false
      }));
      return {
        ...state,
        excludedRSVPIds: [],
        selectedRSVPIds: [],
        selectedAll: false,
        selectedCount: 0,
        eventRsvp
      };
    }
    case SET_SELECTED_ALL_RSVP: {
      const selectedAll = payload;
      const eventRsvp = state.eventRsvp.map((i) => ({
        ...i,
        checked: selectedAll
      }));
      const selectedCount = selectedAll ? state.totalEventRsvp : 0;
      return {
        ...state,
        eventRsvp,
        selectedAll,
        selectedCount,
        selectedRSVPIds: [],
        excludedRSVPIds: []
      };
    }
    case SELECT_EVENT_RSVP: {
      const {
        selectedAll,
        selectedRSVPIds,
        excludedRSVPIds,
        selectedCount,
        eventRsvp
      } = state;
      const rsvpId = payload;
      const rsvp = eventRsvp.find((a) => a.id === rsvpId);
      rsvp.checked = true;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedRSVPIds: excludedRSVPIds.filter((it) => it !== rsvpId),
          selectedRSVPIds: []
        };
      } else {
        newState = {
          ...state,
          selectedRSVPIds: [...selectedRSVPIds, rsvpId],
          excludedRSVPIds: []
        };
      }

      return {
        ...newState,
        eventRsvp,
        selectedCount: selectedCount + 1
      };
    }
    case UNSELECT_EVENT_RSVP: {
      const {
        selectedAll,
        selectedRSVPIds,
        excludedRSVPIds,
        selectedCount,
        eventRsvp
      } = state;
      const rsvpId = payload;
      const rsvp = eventRsvp.find((a) => a.id === rsvpId);
      rsvp.checked = false;

      let newState = {};

      if (selectedAll) {
        newState = {
          ...state,
          excludedRSVPIds: [...excludedRSVPIds, rsvpId],
          selectedRSVPIds: []
        };
      } else {
        newState = {
          ...state,
          selectedRSVPIds: selectedRSVPIds.filter((it) => it !== rsvpId),
          excludedRSVPIds: []
        };
      }

      return {
        ...newState,
        eventRsvp,
        selectedCount: selectedCount - 1
      };
    }
    default:
      return state;
  }
};

export default eventRSVPListReducer;
