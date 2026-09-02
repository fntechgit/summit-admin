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

import { epochToMoment } from "openstack-uicore-foundation/lib/utils/methods";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  CLEAR_LOG_PARAMS,
  REQUEST_LOG,
  RECEIVE_LOG
} from "../../actions/audit-log-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { formatAuditLog, parseSpeakerAuditLog } from "../../utils/methods";
import { MAX_PER_PAGE } from "../../utils/constants";

const DEFAULT_STATE = {
  term: "",
  logEntries: [],
  currentPage: 1,
  lastPage: 1,
  perPage: MAX_PER_PAGE,
  order: "created",
  orderDir: 1,
  totalLogEntries: 0
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
