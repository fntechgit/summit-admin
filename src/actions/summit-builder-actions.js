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

import moment from "moment-timezone";
import {
  createAction,
  getRequest,
  putRequest,
  startLoading,
  stopLoading,
  deleteRequest,
  authErrorHandler,
  escapeFilterValue
} from "openstack-uicore-foundation/lib/utils/actions";
import { SummitEvent } from "openstack-uicore-foundation/lib/models";
import {
  TIME_59,
  MILLISECONDS,
  ONE_MINUTE,
  ScheduleEventsSearchResultMaxPage,
  TWENTY_PER_PAGE,
  TIME_23_HOURS
} from "../utils/constants";
import { checkProximityEvents } from "./event-actions";
import { getAccessTokenSafely } from "../utils/methods";

export const REQUEST_UNSCHEDULE_EVENTS_PAGE = "REQUEST_UNSCHEDULE_EVENTS_PAGE";
export const RECEIVE_UNSCHEDULE_EVENTS_PAGE = "RECEIVE_UNSCHEDULE_EVENTS_PAGE";
export const REQUEST_SCHEDULE_EVENTS_PAGE = "REQUEST_SCHEDULE_EVENTS_PAGE";
export const RECEIVE_SCHEDULE_EVENTS_PAGE = "RECEIVE_SCHEDULE_EVENTS_PAGE";
export const REQUEST_PROPOSED_SCHEDULE = "REQUEST_PROPOSED_SCHEDULE";
export const RECEIVE_PROPOSED_SCHEDULE = "RECEIVE_PROPOSED_SCHEDULE";
export const REQUEST_SHOW_ALWAYS_EVENTS = "REQUEST_SHOW_ALWAYS_EVENTS";
export const RECEIVE_SHOW_ALWAYS_EVENTS = "RECEIVE_SHOW_ALWAYS_EVENTS";
export const REQUEST_PUBLISH_EVENT = "REQUEST_PUBLISH_EVENT";
export const ERROR_PUBLISH_EVENT = "ERROR_PUBLISH_EVENT";
export const CHANGE_CURRENT_DAY = "CHANGE_CURRENT_DAY";
export const CHANGE_CURRENT_LOCATION = "CHANGE_CURRENT_LOCATION";
export const CHANGE_CURRENT_EVENT_TYPE = "CHANGE_CURRENT_EVENT_TYPE";
export const CHANGE_CURRENT_TRACK = "CHANGE_CURRENT_TRACK";
export const CHANGE_CURRENT_DURATION = "CHANGE_CURRENT_DURATION";
export const CHANGE_CURRENT_PRESENTATION_SELECTION_STATUS =
  "CHANGE_CURRENT_PRESENTATION_SELECTION_STATUS";
export const CHANGE_CURRENT_PRESENTATION_SELECTION_PLAN =
  "CHANGE_CURRENT_PRESENTATION_SELECTION_PLAN";
export const CHANGE_CURRENT_UNSCHEDULE_SEARCH_TERM =
  "CHANGE_CURRENT_UNSCHEDULE_SEARCH_TERM";
export const CHANGE_CURRENT_SCHEDULE_SEARCH_TERM =
  "CHANGE_CURRENT_SCHEDULE_SEARCH_TERM";
export const CHANGE_CURRENT_ORDER_BY = "CHANGE_CURRENT_ORDER_BY";
export const UNPUBLISHED_EVENT = "UNPUBLISHED_EVENT";
export const RECEIVE_SCHEDULE_EVENTS_SEARCH_PAGE =
  "RECEIVE_SCHEDULE_EVENTS_SEARCH_PAGE";
export const RECEIVE_EMPTY_SPOTS = "RECEIVE_EMPTY_SPOTS";
export const CLEAR_EMPTY_SPOTS = "CLEAR_EMPTY_SPOTS";
export const CLEAR_PUBLISHED_EVENTS = "CLEAR_PUBLISHED_EVENTS";
export const CLEAR_UNPUBLISHED_EVENTS = "CLEAR_UNPUBLISHED_EVENTS";
export const CLEAR_PROPOSED_EVENTS = "CLEAR_PROPOSED_EVENTS";
export const CHANGE_SUMMIT_BUILDER_FILTERS = "CHANGE_SUMMIT_BUILDER_FILTERS";
export const SET_SLOT_SIZE = "SET_SLOT_SIZE";
export const SET_SOURCE = "SET_SOURCE";
export const PROPOSED_EVENTS_PUBLISHED = "PROPOSED_EVENTS_PUBLISHED";
export const RECEIVE_PROPOSED_SCHED_LOCKS = "RECEIVE_PROPOSED_SCHED_LOCKS";
export const UNLOCK_PROPOSED_SCHED = "UNLOCK_PROPOSED_SCHED";

export const getProposedScheduleLocks = () => async (dispatch, getState) => {
  const { currentSummitState, currentScheduleBuilderState } = getState();
  const { currentSummit } = currentSummitState;
  const { proposedSchedTrack } = currentScheduleBuilderState;
  const accessToken = await getAccessTokenSafely();

  const params = {
    expand: "created_by,created_by.member",
    page: 1,
    per_page: 100,
    access_token: accessToken,
    "filter[]": [`track_id==${proposedSchedTrack?.id}`]
  };

  if (proposedSchedTrack) {
    dispatch(startLoading());

    return getRequest(
      null,
      createAction(RECEIVE_PROPOSED_SCHED_LOCKS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/proposed-schedules/track-chairs/locks`,
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  }

  return Promise.resolve();
};

export const getUnScheduleEventsPage =
  (
    summitId,
    page = 1,
    perPage = TWENTY_PER_PAGE,
    eventTypeId = null,
    trackId = null,
    selectionStatus = null,
    selectionPlan = null,
    term = null,
    order = null,
    duration = null,
    resetSelected = true
  ) =>
  async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    dispatch(startLoading());
    // filters
    const filter = [];

    if (eventTypeId != null) {
      filter.push(`event_type_id==${eventTypeId}`);
    }

    if (trackId != null) {
      filter.push(`track_id==${trackId}`);
    }

    if (selectionStatus != null) {
      filter.push(`selection_status==${selectionStatus}`);
    }

    if (selectionPlan != null) {
      filter.push(`selection_plan_id==${selectionPlan}`);
    }

    if (duration != null) {
      if (Array.isArray(duration)) {
        filter.push(`duration>=${duration[0] * ONE_MINUTE}`);
        filter.push(`duration<=${duration[1] * ONE_MINUTE}`);
      } else {
        filter.push(
          `duration${duration.replace(/\d/g, "")}${
            duration.replace(/\D/g, "") * ONE_MINUTE
          }`
        );
      }
    }

    if (term) {
      const escapedTerm = escapeFilterValue(term);
      let searchString = `title=@${escapedTerm},abstract=@${escapedTerm},tags=@${escapedTerm},speaker=@${escapedTerm},speaker_email=@${escapedTerm}`;

      if (parseInt(term, 10)) {
        searchString += `,id==${parseInt(term, 10)}`;
      }

      filter.push(searchString);
    }

    const params = {
      page,
      per_page: perPage,
      access_token: accessToken,
      expand: "speakers",
      relations: "speakers,speakers.none",
      fields:
        "id,class_name,description,duration,end_date,start_date,is_published,title,track_id,type_id,speakers.id,speakers.first_name,speakers.last_name"
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null) {
      params.order = `+${order}`;
    }

    if (resetSelected) {
      await dispatch(createAction(CLEAR_UNPUBLISHED_EVENTS)({}));
    }

    return getRequest(
      createAction(REQUEST_UNSCHEDULE_EVENTS_PAGE),
      createAction(RECEIVE_UNSCHEDULE_EVENTS_PAGE),
      `${window.API_BASE_URL}/api/v1/summits/${summitId}/events/unpublished`,
      authErrorHandler,
      { unPublishedFilter: filter }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const publishEvent =
  (event, day, startTime, minutes) => async (dispatch, getState) => {
    const { currentSummitState, currentScheduleBuilderState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const { currentLocation } = currentScheduleBuilderState;

    const eventModel = new SummitEvent(event, currentSummit);
    eventModel._event.duration = minutes * ONE_MINUTE;
    const [eventStarDateTime, eventEndDateTime] = eventModel.calculateNewDates(
      day,
      startTime,
      minutes
    );

    dispatch(startLoading());
    putRequest(
      null,
      createAction(REQUEST_PUBLISH_EVENT)({
        currentSummit,
        currentLocation,
        event,
        day,
        startTime,
        minutes
      }),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${event.id}/publish?access_token=${accessToken}`,
      {
        location_id: currentLocation.id,
        start_date: eventStarDateTime.valueOf() / MILLISECONDS,
        end_date: eventEndDateTime.valueOf() / MILLISECONDS,
        duration: eventModel._event.duration
      },
      authErrorHandler
    )({})(dispatch)
      .then(() => {
        dispatch(checkProximityEvents(event, false));
      })
      .catch(() => {
        if (event.is_published)
          dispatch(createAction(ERROR_PUBLISH_EVENT)({ event }));
        dispatch(stopLoading());
      });
  };

export const changeCurrentSelectedDay = (currentSelectedDay) => (dispatch) => {
  dispatch(
    createAction(CHANGE_CURRENT_DAY)({
      day: currentSelectedDay
    })
  );
};

export const changeCurrentSelectedLocation =
  (currentSelectedLocation) => (dispatch) => {
    dispatch(
      createAction(CHANGE_CURRENT_LOCATION)({
        location: currentSelectedLocation
      })
    );
  };

export const changeSlotSize = (slotSize) => (dispatch) => {
  dispatch(createAction(SET_SLOT_SIZE)({ slotSize }));
};

export const changeSource = (selectedSource) => (dispatch) => {
  dispatch(createAction(SET_SOURCE)({ selectedSource }));
};

export const getPublishedEventsBySummitDayLocation =
  (currentSummit, currentDay, currentLocation) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    currentDay = moment.tz(currentDay, currentSummit.time_zone.name);
    const startDate =
      currentDay.clone().hours(0).minutes(0).seconds(0).valueOf() /
      MILLISECONDS;
    const endDate =
      currentDay
        .clone()
        .hours(TIME_23_HOURS)
        .minutes(TIME_59)
        .seconds(TIME_59)
        .valueOf() / MILLISECONDS;
    const filter = [`start_date>=${startDate}`, `end_date<=${endDate}`];

    dispatch(startLoading());

    const params = {
      page: 1,
      per_page: 100,
      access_token: accessToken,
      "filter[]": filter
    };

    return getRequest(
      createAction(REQUEST_SCHEDULE_EVENTS_PAGE),
      createAction(RECEIVE_SCHEDULE_EVENTS_PAGE),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/locations/${currentLocation.id}/events/published`,
      authErrorHandler,
      { publishedFilter: filter }
    )(params)(dispatch).then(() => dispatch(stopLoading()));
  };

const refreshPublishedList = () => async (dispatch, getState) => {
  const { currentSummitState, currentScheduleBuilderState } = getState();
  const { currentSummit } = currentSummitState;
  const { currentLocation, currentDay } = currentScheduleBuilderState;
  return getPublishedEventsBySummitDayLocation(
    currentSummit,
    currentDay,
    currentLocation
  )(dispatch, getState);
};

export const getShowAlwaysEvents =
  (summit, proposedSchedDay, proposedSchedLocation) => async (dispatch) => {
    const accessToken = await getAccessTokenSafely();
    const proposedSchedDayMoment = moment.tz(
      proposedSchedDay,
      summit.time_zone.name
    );
    const startDate =
      proposedSchedDayMoment.clone().hours(0).minutes(0).seconds(0).valueOf() /
      MILLISECONDS;
    const endDate =
      proposedSchedDayMoment
        .clone()
        .hours(TIME_23_HOURS)
        .minutes(TIME_59)
        .seconds(TIME_59)
        .valueOf() / MILLISECONDS;
    const params = {
      page: 1,
      per_page: 100,
      access_token: accessToken,
      "filter[]": [
        `start_date>=${startDate}`,
        `end_date<=${endDate}`,
        "type_show_always_on_schedule==true"
      ]
    };

    dispatch(startLoading());

    return getRequest(
      createAction(REQUEST_SHOW_ALWAYS_EVENTS),
      createAction(RECEIVE_SHOW_ALWAYS_EVENTS),
      `${window.API_BASE_URL}/api/v1/summits/${summit.id}/locations/${proposedSchedLocation.id}/events/published`,
      authErrorHandler
    )(params)(dispatch).then(() => dispatch(stopLoading()));
  };

export const getProposedEvents =
  (summit, proposedSchedDay, proposedSchedLocation, proposedSchedTrack) =>
  async (dispatch) => {
    if (!summit || !proposedSchedDay || !proposedSchedLocation) {
      return dispatch(
        createAction(CLEAR_PROPOSED_EVENTS)({
          proposedSchedDay,
          proposedSchedLocation,
          proposedSchedTrack
        })
      );
    }

    const accessToken = await getAccessTokenSafely();
    const proposedSchedDayMoment = moment.tz(
      proposedSchedDay,
      summit.time_zone.name
    );
    const startDate =
      proposedSchedDayMoment.clone().hours(0).minutes(0).seconds(0).valueOf() /
      MILLISECONDS;
    const endDate =
      proposedSchedDayMoment
        .clone()
        .hours(TIME_23_HOURS)
        .minutes(TIME_59)
        .seconds(TIME_59)
        .valueOf() / MILLISECONDS;
    const filter = [];
    const params = {
      expand: "summit_event",
      page: 1,
      per_page: 100,
      access_token: accessToken
    };

    filter.push(`start_date>=${startDate}`);
    filter.push(`end_date<=${endDate}`);
    filter.push(`location_id==${proposedSchedLocation.id}`);

    if (proposedSchedTrack) {
      filter.push(`track_id==${proposedSchedTrack.id}`);
    }

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    dispatch(startLoading());

    return getRequest(
      createAction(REQUEST_PROPOSED_SCHEDULE),
      createAction(RECEIVE_PROPOSED_SCHEDULE),
      `${window.API_BASE_URL}/api/v1/summits/${summit.id}/proposed-schedules/track-chairs/presentations`,
      authErrorHandler,
      { proposedSchedDay, proposedSchedLocation, proposedSchedTrack }
    )(params)(dispatch).then(() => {
      dispatch(
        getShowAlwaysEvents(summit, proposedSchedDay, proposedSchedLocation)
      );
      dispatch(getProposedScheduleLocks());
    });
  };

export const publishAllProposed = (eventIds) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const params = { access_token: accessToken };
  dispatch(startLoading());

  putRequest(
    null,
    createAction(PROPOSED_EVENTS_PUBLISHED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/proposed-schedules/track-chairs/presentations/all/publish`,
    { event_ids: eventIds },
    authErrorHandler
  )(params)(dispatch).then(() => {
    dispatch(refreshPublishedList());
  });
};

export const unlockProposedSchedule =
  (message) => async (dispatch, getState) => {
    const { currentSummitState, currentScheduleBuilderState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const { proposedSchedTrack } = currentScheduleBuilderState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(UNLOCK_PROPOSED_SCHED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/proposed-schedules/track-chairs/tracks/${proposedSchedTrack.id}/lock`,
      { message },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const changeCurrentEventType = (currentEventType) => (dispatch) => {
  dispatch(
    createAction(CHANGE_CURRENT_EVENT_TYPE)({
      eventType: currentEventType
    })
  );
};

export const changeCurrentTrack = (currentTrack) => (dispatch) => {
  dispatch(
    createAction(CHANGE_CURRENT_TRACK)({
      track: currentTrack
    })
  );
};

export const changeCurrentDuration = (currentDuration) => (dispatch) => {
  dispatch(
    createAction(CHANGE_CURRENT_DURATION)({
      duration: currentDuration
    })
  );
};

export const changeCurrentPresentationSelectionStatus =
  (currentPresentationSelectionStatus) => (dispatch) => {
    dispatch(
      createAction(CHANGE_CURRENT_PRESENTATION_SELECTION_STATUS)({
        presentationSelectionStatus: currentPresentationSelectionStatus
      })
    );
  };

export const changeCurrentPresentationSelectionPlan =
  (currentPresentationSelectionPlan) => (dispatch) => {
    dispatch(
      createAction(CHANGE_CURRENT_PRESENTATION_SELECTION_PLAN)({
        presentationSelectionPlan: currentPresentationSelectionPlan
      })
    );
  };

export const changeCurrentUnScheduleOrderBy = (orderBy) => (dispatch) => {
  dispatch(
    createAction(CHANGE_CURRENT_ORDER_BY)({
      orderBy
    })
  );
};

export const changeCurrentUnscheduleSearchTerm = (term) => (dispatch) => {
  dispatch(
    createAction(CHANGE_CURRENT_UNSCHEDULE_SEARCH_TERM)({
      term
    })
  );
};

export const changeCurrentScheduleSearchTerm = (term) => (dispatch) => {
  dispatch(
    createAction(CHANGE_CURRENT_SCHEDULE_SEARCH_TERM)({
      term
    })
  );
};

export const unPublishEvent = (event) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  dispatch(startLoading());
  deleteRequest(
    null,
    createAction(UNPUBLISHED_EVENT)({
      event
    }),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${event.id}/publish?access_token=${accessToken}`,
    {},
    authErrorHandler
  )({})(dispatch).then(() => {
    dispatch(stopLoading());
  });
};

export const searchScheduleEvents = (term) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;
  const filter = [];

  dispatch(startLoading());

  if (term) {
    const escapedTerm = escapeFilterValue(term);
    let searchString = `title=@${escapedTerm},abstract=@${escapedTerm},social_summary=@${term},tags=@${escapedTerm},speaker=@${escapedTerm},speaker_email=@${escapedTerm}`;

    if (parseInt(term, 10)) {
      searchString += `,id==${parseInt(term, 10)}`;
    }

    filter.push(searchString);
  }

  const params = {
    page: 1,
    per_page: ScheduleEventsSearchResultMaxPage,
    access_token: accessToken,
    order: "+title,+id"
  };

  if (filter.length > 0) {
    params["filter[]"] = filter;
  }

  return getRequest(
    null,
    createAction(RECEIVE_SCHEDULE_EVENTS_SEARCH_PAGE),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/published`,
    authErrorHandler
  )(params)(dispatch).then(() => dispatch(stopLoading()));
};

export const getEmptySpots =
  (location, fromDate, toDate, gapSize) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      access_token: accessToken,
      "filter[]": [
        `location_id==${location.id}`,
        `start_date>=${fromDate}`,
        `end_date<=${toDate}`,
        `gap>=${gapSize}`
      ]
    };

    return getRequest(
      null,
      createAction(RECEIVE_EMPTY_SPOTS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/published/empty-spots`,
      authErrorHandler
    )(params)(dispatch).then(() => dispatch(stopLoading()));
  };

export const clearEmptySpots = () => (dispatch) => {
  dispatch(createAction(CLEAR_EMPTY_SPOTS)());
};

export const clearPublishedEvents = () => (dispatch) => {
  dispatch(createAction(CLEAR_PUBLISHED_EVENTS)());
};

export const changeSummitBuilderFilters = (filters) => (dispatch) => {
  dispatch(createAction(CHANGE_SUMMIT_BUILDER_FILTERS)(filters));
};
