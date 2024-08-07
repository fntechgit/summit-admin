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
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { LOGOUT_USER } from "openstack-uicore-foundation/lib/security/actions";
import {
  CLEAR_LOG_PARAMS,
  REQUEST_LOG,
  RECEIVE_LOG
} from "../../actions/audit-log-actions";

import { SET_CURRENT_SUMMIT } from "../../actions/summit-actions";
import { formatAuditLog, parseSpeakerAuditLog } from "../../utils/methods";

const DEFAULT_STATE = {
  term: "",
  logEntries: [],
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  order: "created",
  orderDir: 1,
  totalLogEntries: 0,
  summitTZ: "",
  filters: {}
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
      const { term, order, orderDir, summitTZ } = payload;
      return { ...state, term, order, orderDir, summitTZ };
    }
    case RECEIVE_LOG: {
      const { current_page, total, last_page } = payload.response;

      const logEntries = payload.response.data.map((e) => {
        const logEntryAction = e.action.startsWith("Speaker")
          ? parseSpeakerAuditLog(e.action)
          : e.action;

        return {
          ...e,
          event: e.event_id,
          user: `${e.user.first_name} ${e.user.last_name} (${e.user.id})`,
          created: moment(
            epochToMomentTimeZone(e.created, state.summitTZ)
          ).format("MMMM Do YYYY, h:mm a"),
          action: formatAuditLog(logEntryAction)
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
