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
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  EVENT_OVERFLOW_DELETED,
  EVENT_OVERFLOW_UPDATED,
  RECEIVE_CURRENT_EVENT_FOR_OCCUPANCY,
  RECEIVE_EVENTS_FOR_OCCUPANCY,
  REQUEST_CURRENT_EVENT_FOR_OCCUPANCY,
  REQUEST_EVENTS_FOR_OCCUPANCY,
  UPDATE_EVENT
} from "../../actions/event-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { MILLISECONDS_TO_SECONDS } from "../../utils/constants";

const DEFAULT_STATE = {
  events: [],
  currentEvent: {},
  term: null,
  roomId: null,
  currentEvents: false,
  order: "start_date",
  orderDir: 1,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalEvents: 0,
  summitTZ: ""
};

const roomOccupancyReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EVENTS_FOR_OCCUPANCY: {
      const { order, orderDir, term, roomId, currentEvents, summitTZ } =
        payload;

      return {
        ...state,
        order,
        orderDir,
        term,
        roomId,
        currentEvents,
        summitTZ
      };
    }
    case REQUEST_CURRENT_EVENT_FOR_OCCUPANCY: {
      const { summitTZ } = payload;

      return { ...state, summitTZ };
    }
    case RECEIVE_EVENTS_FOR_OCCUPANCY: {
      const { current_page, total, last_page } = payload.response;
      const events = payload.response.data.map((e) => ({
        id: e.id,
        title: e.title,
        start_date: moment(e.start_date * MILLISECONDS_TO_SECONDS)
          .tz(state.summitTZ)
          .format("ddd h:mm a"),
        room: e.location ? e.location.name : "",
        occupancy: e.occupancy || "EMPTY",
        speakers: e.speakers
          ? e.speakers.map((s) => `${s.first_name} ${s.last_name}`).join(",")
          : "",
        track: e.track?.name || "N/A",
        overflow_streaming_url: e.overflow_streaming_url,
        overflow_stream_is_secure: e.overflow_stream_is_secure
      }));

      return {
        ...state,
        events,
        currentPage: current_page,
        totalEvents: total,
        lastPage: last_page
      };
    }
    case RECEIVE_CURRENT_EVENT_FOR_OCCUPANCY: {
      let currentEvent = {};
      let payloadEvent = null;

      if (
        payload.response.hasOwnProperty("data") &&
        payload.response.data.length === 1
      ) {
        payloadEvent = payload.response.data[0];
      } else if (payload.response.hasOwnProperty("id")) {
        payloadEvent = { ...payload.response };
      }

      if (payloadEvent) {
        currentEvent = {
          id: payloadEvent.id,
          title: payloadEvent.title,
          start_date: moment(payloadEvent.start_date * MILLISECONDS_TO_SECONDS)
            .tz(state.summitTZ)
            .format("ddd h:mm a"),
          end_date: moment(payloadEvent.end_date * MILLISECONDS_TO_SECONDS)
            .tz(state.summitTZ)
            .format("ddd h:mm a"),
          room: payloadEvent.location ? payloadEvent.location.name : "",
          occupancy: payloadEvent.occupancy || "EMPTY",
          speakers: payloadEvent.speakers
            ? payloadEvent.speakers
                .map((s) => `${s.first_name} ${s.last_name}`)
                .join(",")
            : ""
        };
      }

      return { ...state, currentEvent };
    }
    case UPDATE_EVENT: {
      const updatedEvent = payload;
      let { currentEvent } = state;

      const events = state.events.map((e) => {
        if (e.id === updatedEvent.id) return updatedEvent;
        return e;
      });

      if (currentEvent.id === updatedEvent.id) {
        currentEvent = { ...updatedEvent };
      }

      return { ...state, events: [...events], currentEvent };
    }
    case EVENT_OVERFLOW_DELETED:
    case EVENT_OVERFLOW_UPDATED: {
      const updatedEvent = payload.response;
      const { events } = state;

      const newEvents = events.map((ev) => {
        if (ev.id === updatedEvent.id) {
          return {
            ...ev,
            occupancy: updatedEvent.occupancy || "EMPTY",
            overflow_stream_is_secure: updatedEvent.overflow_stream_is_secure,
            overflow_streaming_url: updatedEvent.overflow_streaming_url
          };
        }

        return ev;
      });

      return { ...state, events: newEvents };
    }
    default:
      return state;
  }
};

export default roomOccupancyReducer;
