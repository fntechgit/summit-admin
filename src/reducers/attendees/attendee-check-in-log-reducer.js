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
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  CLEAR_ATTENDEE_CHECK_IN_LOGS,
  REQUEST_ATTENDEE_CHECK_IN_LOGS,
  RECEIVE_ATTENDEE_CHECK_IN_LOGS
} from "../../actions/attendee-check-in-log-actions";
import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { MILLISECONDS_IN_SECOND } from "../../utils/constants";

const DEFAULT_STATE = {
  logs: [],
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  order: "created",
  orderDir: -1,
  term: "",
  totalLogs: 0
};

export const formatActor = (log) => {
  const { actor } = log;
  if (actor && typeof actor === "object") {
    const name = `${actor.first_name ?? ""} ${actor.last_name ?? ""}`.trim();
    return name ? `${name} (${actor.email})` : actor.email;
  }
  // no member resolved from the token: fall back to the OAuth2 client
  return log.client_id || "N/A";
};

export const formatCheckInLog = (log) => ({
  ...log,
  actor_email: formatActor(log),
  reason: log.reason || "-",
  ip_address: log.ip_address || "-",
  created: moment(log.created * MILLISECONDS_IN_SECOND).format(
    "MMMM Do YYYY, h:mm:ss a"
  )
});

const attendeeCheckInLogReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case CLEAR_ATTENDEE_CHECK_IN_LOGS:
    case LOGOUT_USER:
      return DEFAULT_STATE;
    case REQUEST_ATTENDEE_CHECK_IN_LOGS: {
      const { order, orderDir, term } = payload;
      return { ...state, order, orderDir, term: term ?? "" };
    }
    case RECEIVE_ATTENDEE_CHECK_IN_LOGS: {
      const { data, current_page, last_page, total } = payload.response;
      return {
        ...state,
        logs: data.map(formatCheckInLog),
        currentPage: current_page,
        lastPage: last_page,
        totalLogs: total
      };
    }
    default:
      return state;
  }
};

export default attendeeCheckInLogReducer;
