import {
  authErrorHandler,
  createAction,
  deleteRequest,
  escapeFilterValue,
  getCSV,
  getRequest,
  putRequest,
  startLoading,
  stopLoading
} from "openstack-uicore-foundation/lib/utils/actions";
import moment from "moment-timezone";
import { getAccessTokenSafely } from "../utils/methods";
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_ORDER_DIR,
  DEFAULT_PER_PAGE,
  FIFTEEN_MINUTES
} from "../utils/constants";
import { EVENT_UPDATED, UPDATE_EVENT } from "./event-actions";
import { publishToAblyChannel, subscribeToAblyChannel } from "./ably-actions";

export const EVENT_OVERFLOW_UPDATED = "EVENT_OVERFLOW_UPDATED";
export const EVENT_OVERFLOW_DELETED = "EVENT_OVERFLOW_DELETED";
export const REQUEST_EVENTS_FOR_OCCUPANCY = "REQUEST_EVENTS_FOR_OCCUPANCY";
export const RECEIVE_EVENTS_FOR_OCCUPANCY = "RECEIVE_EVENTS_FOR_OCCUPANCY";
export const REQUEST_CURRENT_EVENT_FOR_OCCUPANCY =
  "REQUEST_CURRENT_EVENT_FOR_OCCUPANCY";
export const RECEIVE_CURRENT_EVENT_FOR_OCCUPANCY =
  "RECEIVE_CURRENT_EVENT_FOR_OCCUPANCY";
export const UPDATE_EVENT_OCCUPANCY = "UPDATE_EVENT_OCCUPANCY";

/* *************************************************************************** */
/*                    ABLY                                                     */
/* *************************************************************************** */

export const getAblyChannel = (summitId) => `OCCUPANCY:${summitId}`;

export const subscribeToOccupancyChannel = () => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const { currentSummit } = currentSummitState;

  const channel = getAblyChannel(currentSummit.id);

  subscribeToAblyChannel(channel, (data) => {
    console.log(`Received: ${JSON.stringify(data)}`);
    dispatch(createAction(UPDATE_EVENT_OCCUPANCY)({ data }));
  });
};

export const publishOccupancy =
  (occupancy, eventId) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const { currentSummit } = currentSummitState;

    const channel = getAblyChannel(currentSummit.id);
    const res = await publishToAblyChannel(channel, "SET_OCCUPANCY", {
      occupancy,
      eventId
    });

    if (res) {
      console.log("ROOM OCCUPANCY PUBLISHED", occupancy, eventId);
    }
  };

/* *************************************************************************** */

export const getEventsForOccupancy =
  (
    term = null,
    roomId = null,
    currentEvents = false,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "start_date",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];
    const summitTZ = currentSummit.time_zone.name;
    let endPoint = "events/published";

    dispatch(startLoading());

    // search
    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`title=@${escapedTerm},speaker=@${escapedTerm}`);
    }

    // room filter
    if (roomId != null) {
      endPoint = `locations/${roomId}/${endPoint}`;
    }

    // only current events
    if (currentEvents) {
      const now = moment().tz(summitTZ).unix(); // now in summit timezone converted to epoch
      const fromDate = now - FIFTEEN_MINUTES; // minus 15min
      const toDate = now + FIFTEEN_MINUTES; // plus 15min
      filter.push(`start_date<=${toDate}`);
      filter.push(`end_date>=${fromDate}`);
    }

    const params = {
      expand: "speakers, location, track",
      page,
      per_page: perPage,
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    return getRequest(
      createAction(REQUEST_EVENTS_FOR_OCCUPANCY),
      createAction(RECEIVE_EVENTS_FOR_OCCUPANCY),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/${endPoint}`,
      authErrorHandler,
      { order, orderDir, term, roomId, currentEvents, summitTZ }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const getEventsForOccupancyCSV =
  (
    term = null,
    roomId = null,
    currentEvents = false,
    order = "start_date",
    orderDir = DEFAULT_ORDER_DIR
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];
    const summitTZ = currentSummit.time_zone.name;

    dispatch(startLoading());

    filter.push("published==1");

    // search
    if (term) {
      const escapedTerm = escapeFilterValue(term);
      filter.push(`title=@${escapedTerm},speaker=@${escapedTerm}`);
    }

    // room filter
    if (roomId != null) {
      filter.push(`location_id==${roomId}`);
    }

    // only current events
    if (currentEvents) {
      const now = moment().tz(summitTZ).unix(); // now in summit timezone converted to epoch
      const fromDate = now - FIFTEEN_MINUTES; // minus 15min
      const toDate = now + FIFTEEN_MINUTES; // plus 15min
      filter.push(`start_date<=${toDate}`);
      filter.push(`end_date>=${fromDate}`);
    }

    const params = {
      access_token: accessToken
    };

    if (filter.length > 0) {
      params["filter[]"] = filter;
    }

    // order
    if (order != null && orderDir != null) {
      const orderDirSign = orderDir === DEFAULT_ORDER_DIR ? "+" : "-";
      params.order = `${orderDirSign}${order}`;
    }

    params.fields =
      "start_date,title,track,occupancy,location_name,speaker_fullnames";

    const filename = `summit-${currentSummit.slug}-rooms-occupancy.csv`;

    dispatch(
      getCSV(
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/csv`,
        params,
        filename
      )
    );
  };

export const getCurrentEventForOccupancy =
  (roomId, eventId = null) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filter = [];
    const summitTZ = currentSummit.time_zone.name;
    let endPoint = `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}`;

    dispatch(startLoading());

    const params = {
      expand: "speakers, location",
      page: 1,
      per_page: 100,
      access_token: accessToken
    };

    if (eventId) {
      endPoint += `/events/${eventId}`;
    } else {
      endPoint += `/locations/${roomId}/events/published`;

      // only current events
      const now = moment().tz(summitTZ).unix(); // now in summit timezone converted to epoch
      filter.push(`start_date<=${now}`);
      filter.push(`end_date>=${now}`);
      params["filter[]"] = filter;
    }

    return getRequest(
      createAction(REQUEST_CURRENT_EVENT_FOR_OCCUPANCY),
      createAction(RECEIVE_CURRENT_EVENT_FOR_OCCUPANCY),
      endPoint,
      authErrorHandler,
      { summitTZ }
    )(params)(dispatch).then(({response}) => {
      dispatch(stopLoading());
      return response;
    });
  };

export const saveOccupancy = (entity) => async (dispatch, getState) => {
  const { currentSummitState } = getState();
  const accessToken = await getAccessTokenSafely();
  const { currentSummit } = currentSummitState;

  const params = {
    access_token: accessToken
  };

  putRequest(
    createAction(UPDATE_EVENT),
    createAction(EVENT_UPDATED),
    `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${entity.id}`,
    { id: entity.id, occupancy: entity.occupancy },
    authErrorHandler,
    entity
  )(params)(dispatch).then(() => {
    publishOccupancy(entity.occupancy, entity.id)(dispatch, getState);
  });
};

export const saveOverflowOccupancy =
  (eventId, streamUrl, isSecure) => async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    const payload = {
      overflow_streaming_url: streamUrl,
      overflow_stream_is_secure: isSecure
    };

    putRequest(
      null,
      createAction(EVENT_OVERFLOW_UPDATED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/overflow`,
      payload,
      authErrorHandler
    )(params)(dispatch);
  };

export const deleteOverflowOccupancy =
  (eventId, newOccupancy = "EMPTY") =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    const params = {
      access_token: accessToken
    };

    return deleteRequest(
      null,
      createAction(EVENT_OVERFLOW_DELETED),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/events/${eventId}/overflow`,
      { occupancy: newOccupancy },
      authErrorHandler
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };
