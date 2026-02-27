/* *
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
import { epochToMomentTimeZone } from "openstack-uicore-foundation/lib/utils/methods";
import { RECEIVE_EMAILS, REQUEST_EMAILS } from "../../actions/email-actions";

const DEFAULT_STATE = {
  emails: [],
  term: "",
  order: "id",
  orderDir: 0,
  currentPage: 1,
  lastPage: 1,
  perPage: 10,
  totalEmails: 0,
  filters: {}
};

const emailLogListReducer = (state = DEFAULT_STATE, action) => {
  const { type, payload } = action;
  switch (type) {
    case LOGOUT_USER: {
      return DEFAULT_STATE;
    }
    case REQUEST_EMAILS: {
      const { order, orderDir, term, filters } = payload;

      return { ...state, order, orderDir, term, filters };
    }
    case RECEIVE_EMAILS: {
      let { total, last_page, current_page, data } = payload.response;

      data = data.map((m) => {
        const sent_date = m.sent_date
          ? epochToMomentTimeZone(m.sent_date, "UTC").format(
              "MMMM Do YYYY, h:mm:ss a"
            )
          : "";
        return {
          ...m,
          template: m.template?.identifier || "N/A",
          sent_date,
          last_error: m.last_error ? m.last_error : "N/A"
        };
      });
      return {
        ...state,
        emails: data,
        currentPage: current_page,
        totalEmails: total,
        lastPage: last_page
      };
    }
    default:
      return state;
  }
};

export default emailLogListReducer;
