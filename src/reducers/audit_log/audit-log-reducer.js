/**
 * Copyright 2022 OpenStack Foundation
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
  epochToMoment,
  epochToMomentTimeZone
} from "openstack-uicore-foundation/lib/utils/methods";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  CLEAR_LOG_PARAMS,
  REQUEST_LOG,
  RECEIVE_LOG
} from "../../actions/audit-log-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { MAX_PER_PAGE } from "../../utils/constants";

const DEFAULT_STATE = {
  term: "",
  logEntries: [],
  currentPage: 1,
  lastPage: 1,
  perPage: MAX_PER_PAGE,
  order: "created",
  orderDir: -1,
  totalLogEntries: 0
};

export const formatAuditLog = (logString) => {
  const timeZone = moment.tz.guess();
  const dateTimeRegExp = /\d{4}([.\-/ ])\d{2}\1\d{2} \d{1,2}:\d{2}:\d{2}/g;
  const dateTimeMatch = logString.match(dateTimeRegExp);
  if (!dateTimeMatch) return logString;
  const dt = moment.utc(dateTimeMatch[0], "YYYY-MM-DD HH:mm:ss");
  if (!moment.isMoment(dt)) return logString;
  const userDt = epochToMomentTimeZone(dt.unix(), timeZone);
  if (!moment.isMoment(userDt)) return logString;
  return logString.replace(
    dateTimeMatch[0],
    userDt.format("YYYY-MM-DD HH:mm:ss")
  );
};

export const parseSpeakerAuditLog = (logString) => {
  const logEntries = logString.split("|");
  const userChanges = {};
  const emailRegExp =
    /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
  // eslint-disable-next-line
  for (const entry of logEntries) {
    const emailMatch = entry.match(emailRegExp);
    if (!emailMatch) continue;
    const email = emailMatch[0];
    if (entry.includes("added")) {
      // eslint-disable-next-line no-magic-numbers
      userChanges[email] = (userChanges[email] || 0) + 1;
    } else if (entry.includes("removed")) {
      // eslint-disable-next-line no-magic-numbers
      userChanges[email] = (userChanges[email] || 0) - 1;
    }
  }

  const relevantChanges = [];
  // eslint-disable-next-line
  for (const [email, changeCount] of Object.entries(userChanges)) {
    if (changeCount !== 0) {
      relevantChanges.push(
        `Speaker ${email} ${
          changeCount > 0
            ? "was added to the collection"
            : "was removed from the collection"
        }`
      );
    }
  }

  return relevantChanges.length > 0 ? relevantChanges.join("|") : logString;
};

// eslint-disable-next-line default-param-last
const auditLogReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case SET_CURRENT_SUMMIT:
    case CLEAR_LOG_PARAMS:
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_LOG: {
      const { term, order, orderDir, perPage } = payload;
      return { ...state, term, order, orderDir, perPage };
    }
    case RECEIVE_LOG: {
      const { current_page, total, last_page } = payload.response;

      const logEntries = payload.response.data.map((e) => {
        const rawDescription = e.action_description ?? "";
        const parsedDescription = rawDescription.startsWith("Speaker")
          ? parseSpeakerAuditLog(rawDescription)
          : rawDescription;
        const userFullName = `${e.user?.first_name ?? ""} ${
          e.user?.last_name ?? ""
        }`.trim();

        return {
          ...e,
          event: e.event_id,
          user: `${userFullName || e.user.email} ${
            e.user?.id ? `(${e.user.id})` : ""
          }`,
          created: epochToMoment(e.created).format("MMMM Do YYYY, h:mm a"),
          action_description: formatAuditLog(parsedDescription)
        };
      });

      return {
        ...state,
        logEntries,
        totalLogEntries: total,
        currentPage: current_page,
        lastPage: last_page
      };
    }
    default:
      return state;
  }
};

export default auditLogReducer;
