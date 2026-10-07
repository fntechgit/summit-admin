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

import {
  getRequest,
  createAction,
  stopLoading,
  startLoading,
  authErrorHandler,
  escapeFilterValue,
  getCSV
} from "openstack-uicore-foundation/lib/utils/actions";
import { getAccessTokenSafely } from "../utils/methods";
import { DEFAULT_CURRENT_PAGE, DEFAULT_PER_PAGE } from "../utils/constants";

export const CLEAR_ATTENDEE_CHECK_IN_LOGS = "CLEAR_ATTENDEE_CHECK_IN_LOGS";
export const REQUEST_ATTENDEE_CHECK_IN_LOGS = "REQUEST_ATTENDEE_CHECK_IN_LOGS";
export const RECEIVE_ATTENDEE_CHECK_IN_LOGS = "RECEIVE_ATTENDEE_CHECK_IN_LOGS";

export const parseCheckInLogFilters = (filters = {}, term = null) => {
  const filter = [];

  if (term) {
    filter.push(`actor_email@@${escapeFilterValue(term)}`);
  }

  if (filters.action) {
    filter.push(`action==${filters.action}`);
  }

  const [from, to] = filters.dateFilter || [];
  const hasFrom = from !== null && from > 0;
  const hasTo = to !== null && to > 0;

  if (hasFrom && hasTo) {
    filter.push(`created[]${from}&&${to}`);
  } else if (hasFrom) {
    filter.push(`created>=${from}`);
  } else if (hasTo) {
    filter.push(`created<=${to}`);
  }

  return filter;
};

const buildParams = (accessToken, filters, term, order, orderDir) => {
  const params = { expand: "actor", access_token: accessToken };
  const filter = parseCheckInLogFilters(filters, term);

  if (filter.length > 0) {
    params["filter[]"] = filter;
  }

  if (order != null && orderDir != null) {
    params.order = `${orderDir === 1 ? "+" : "-"}${order}`;
  }

  return params;
};

export const clearAttendeeCheckInLogs = () => (dispatch) => {
  dispatch(createAction(CLEAR_ATTENDEE_CHECK_IN_LOGS)({}));
};

export const getAttendeeCheckInLogs =
  (
    attendeeId,
    term = null,
    page = DEFAULT_CURRENT_PAGE,
    perPage = DEFAULT_PER_PAGE,
    order = "created",
    orderDir = -1,
    filters = {}
  ) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;

    dispatch(startLoading());

    const params = {
      ...buildParams(accessToken, filters, term, order, orderDir),
      page,
      per_page: perPage
    };

    return getRequest(
      createAction(REQUEST_ATTENDEE_CHECK_IN_LOGS),
      createAction(RECEIVE_ATTENDEE_CHECK_IN_LOGS),
      `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/check-in-logs`,
      authErrorHandler,
      { order, orderDir, term, filters }
    )(params)(dispatch).then(() => {
      dispatch(stopLoading());
    });
  };

export const exportAttendeeCheckInLogs =
  (attendeeId, term = null, order = "created", orderDir = -1, filters = {}) =>
  async (dispatch, getState) => {
    const { currentSummitState } = getState();
    const accessToken = await getAccessTokenSafely();
    const { currentSummit } = currentSummitState;
    const filename = `${currentSummit.name}-Attendee_${attendeeId}-CheckInLogs.csv`;

    dispatch(
      getCSV(
        `${window.API_BASE_URL}/api/v1/summits/${currentSummit.id}/attendees/${attendeeId}/check-in-logs/csv`,
        buildParams(accessToken, filters, term, order, orderDir),
        filename
      )
    );
  };
