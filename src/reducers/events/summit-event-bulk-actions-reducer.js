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
import { SummitEvent } from "openstack-uicore-foundation/lib/models";
import {
  REQUEST_SELECTED_EVENTS,
  RECEIVE_SELECTED_EVENTS,
  UPDATE_LOCAL_EVENT,
  UPDATED_REMOTE_EVENTS,
  UPDATE_EVENT_SELECTED_STATE,
  UPDATE_EVENT_SELECTED_STATE_BULK,
  UPDATE_VALIDATION_STATE,
  UPDATE_LOCATION_BULK,
  UPDATE_SELECTION_PLAN_BULK,
  UPDATE_TYPE_BULK,
  UPDATE_START_DATE_BULK,
  UPDATE_END_DATE_BULK,
  UPDATE_ACTIVITY_TYPE_BULK,
  UPDATE_ACTIVITY_CATEGORY_BULK,
  UPDATE_DURATION_BULK,
  UPDATE_STREAMING_URL_BULK,
  UPDATE_STREAMING_TYPE_BULK,
  UPDATE_STREAM_IS_SECURE_BULK,
  UPDATE_MEETING_URL_BULK,
  UPDATE_ETHERPAD_URL_BULK
} from "../../actions/summit-event-bulk-actions";

import {
  CLEAR_PUBLISHED_EVENTS,
  CLEAR_UNPUBLISHED_EVENTS,
  RECEIVE_UNSCHEDULE_EVENTS_PAGE,
  REQUEST_UNSCHEDULE_EVENTS_PAGE
} from "../../actions/summit-builder-actions";

const DEFAULT_STATE = {
  eventOnBulkEdition: [],
  selectedAllUnPublished: false,
  selectedUnPublishedEvents: [],
  excludedUnPublishedEvents: [],
  unPublishedFilter: [],
  totalUnPublished: 0
};

// eslint-disable-next-line default-param-last
const summitEventBulkActionReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;

  switch (type) {
    case CLEAR_PUBLISHED_EVENTS: {
      return { ...state, eventOnBulkEdition: [] };
    }
    case CLEAR_UNPUBLISHED_EVENTS: {
      return {
        ...state,
        selectedUnPublishedEvents: [],
        eventOnBulkEdition: [],
        selectedAllUnPublished: false,
        excludedUnPublishedEvents: []
      };
    }
    case REQUEST_UNSCHEDULE_EVENTS_PAGE: {
      const { unPublishedFilter } = payload;
      return { ...state, unPublishedFilter };
    }
    case RECEIVE_UNSCHEDULE_EVENTS_PAGE: {
      const { total } = payload.response;
      return { ...state, totalUnPublished: total };
    }
    case UPDATE_VALIDATION_STATE: {
      const { currentSummit } = payload;
      let { eventOnBulkEdition } = state;

      eventOnBulkEdition = eventOnBulkEdition.map((event) => {
        const model = new SummitEvent(event, currentSummit);
        return { ...event, is_valid: model.isValid() };
      });

      return { ...state, eventOnBulkEdition };
    }
    case REQUEST_SELECTED_EVENTS: {
      return { ...state, eventOnBulkEdition: [] };
    }
    case RECEIVE_SELECTED_EVENTS: {
      const { data } = payload.response;
      return {
        ...state,
        eventOnBulkEdition: [
          ...state.eventOnBulkEdition,
          ...data.map((event) => ({ ...event, is_valid: false }))
        ]
      };
    }
    case UPDATE_LOCAL_EVENT: {
      const { eventId, mutator } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) =>
        event.id === eventId ? mutator(event) : event
      );
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_EVENT_SELECTED_STATE: {
      const { event, selected } = payload;
      const {
        selectedUnPublishedEvents,
        selectedAllUnPublished,
        excludedUnPublishedEvents
      } = state;
      let newState = {};

      if (selectedAllUnPublished) {
        newState = {
          excludedUnPublishedEvents: selected
            ? excludedUnPublishedEvents.filter((evid) => evid !== event.id)
            : [...excludedUnPublishedEvents, event.id]
        };
      } else {
        newState = {
          selectedUnPublishedEvents: selected
            ? [...selectedUnPublishedEvents, event.id]
            : selectedUnPublishedEvents.filter((evid) => evid !== event.id)
        };
      }

      return { ...state, ...newState };
    }
    case UPDATE_EVENT_SELECTED_STATE_BULK: {
      const { selectedState } = payload;
      return {
        ...state,
        selectedUnPublishedEvents: [],
        excludedUnPublishedEvents: [],
        selectedAllUnPublished: selectedState
      };
    }
    case UPDATE_LOCATION_BULK: {
      const { location } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        location_id: location.id
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_SELECTION_PLAN_BULK: {
      const { selectionPlan } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        selection_plan_id: selectionPlan.id
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_TYPE_BULK: {
      const { eventType } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        type_id: eventType.id
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_START_DATE_BULK: {
      const { start_date } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        start_date
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_END_DATE_BULK: {
      const { end_date } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        end_date
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_ACTIVITY_TYPE_BULK: {
      const { activityType } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        type_id: activityType
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_ACTIVITY_CATEGORY_BULK: {
      const { activityCategory } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        track_id: activityCategory
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_DURATION_BULK: {
      const { duration } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        duration
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_STREAMING_URL_BULK: {
      const { streamingURL } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        streaming_url: streamingURL
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_STREAMING_TYPE_BULK: {
      const { streamingType } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        streaming_type: streamingType
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_STREAM_IS_SECURE_BULK: {
      const { streamIsSecure } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        stream_is_secure: streamIsSecure
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_MEETING_URL_BULK: {
      const { meetingURL } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        meeting_url: meetingURL
      }));
      return { ...state, eventOnBulkEdition };
    }
    case UPDATE_ETHERPAD_URL_BULK: {
      const { etherpadURL } = payload;
      let { eventOnBulkEdition } = state;
      eventOnBulkEdition = eventOnBulkEdition.map((event) => ({
        ...event,
        etherpad_link: etherpadURL
      }));
      return { ...state, eventOnBulkEdition };
    }
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case UPDATED_REMOTE_EVENTS:
    default:
      return state;
  }
};

export default summitEventBulkActionReducer;
